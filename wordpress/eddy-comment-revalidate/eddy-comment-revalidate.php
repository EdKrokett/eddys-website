<?php
/**
 * Plugin Name: Inhalts-Webhook für eduard-andrae.de
 * Description: Meldet Änderungen an Kommentaren UND Beiträgen an die Nuxt-Seite, damit die betroffenen Seiten dort sofort neu gebaut werden statt auf den ISR-Ablauf zu warten.
 * Version:     1.1.0
 * Author:      Eduard Andrae
 * License:     GPL-2.0-or-later
 *
 * Gegenstück: server/api/revalidate.post.ts im Repo eduard-andrae-website.
 * Hintergrund und Begründung: docs/revalidierung.md dort.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const EDDY_CR_OPTION_ENDPOINT = 'eddy_cr_endpoint';
const EDDY_CR_OPTION_SECRET   = 'eddy_cr_secret';
const EDDY_CR_OPTION_LAST     = 'eddy_cr_last_result';
const EDDY_CR_EVENT           = 'eddy_cr_send_webhook';

/* -------------------------------------------------------------------------
 * Auslöser
 *
 * Bewusst drei Haken statt nur der Moderations-Freigabe: Am 16.09.2026 war die
 * Moderationswarteschlange leer und alle sechs Kommentare eines frischen Beitrags
 * standen ohne einen einzigen Freigabeklick auf "approved" — eigene Antworten des
 * eingeloggten Autors und Stammleser mit früher freigegebenem Kommentar laufen
 * automatisch durch. Ein Webhook nur an der Freigabe hätte nie gefeuert.
 * ---------------------------------------------------------------------- */

add_action( 'comment_post', 'eddy_cr_on_comment_post', 10, 3 );

/**
 * Ein neuer Kommentar wurde gespeichert.
 *
 * @param int        $comment_id       Unbenutzt, die Post-ID steht in $commentdata.
 * @param int|string $comment_approved 1 = sofort öffentlich, 0 = Moderation, 'spam'.
 * @param array      $commentdata      Die gespeicherten Kommentardaten.
 */
function eddy_cr_on_comment_post( $comment_id, $comment_approved, $commentdata ) {
	// Pingbacks und Trackbacks zeigt die Nuxt-Seite nicht an.
	if ( ! eddy_cr_is_plain_comment( isset( $commentdata['comment_type'] ) ? $commentdata['comment_type'] : '' ) ) {
		return;
	}

	// Ein Kommentar in Moderation ändert die öffentliche Seite nicht. Wird er später
	// freigegeben, feuert transition_comment_status.
	if ( 1 !== (int) $comment_approved ) {
		return;
	}

	eddy_cr_queue( isset( $commentdata['comment_post_ID'] ) ? (int) $commentdata['comment_post_ID'] : 0 );
}

add_action( 'transition_comment_status', 'eddy_cr_on_status_change', 10, 3 );

/**
 * Der Status eines Kommentars hat sich geändert: freigegeben, zurückgehalten,
 * in den Papierkorb verschoben oder als Spam markiert.
 *
 * @param string     $new_status Neuer Status.
 * @param string     $old_status Bisheriger Status.
 * @param WP_Comment $comment    Der Kommentar.
 */
function eddy_cr_on_status_change( $new_status, $old_status, $comment ) {
	if ( $new_status === $old_status ) {
		return;
	}

	// Relevant ist nur, wenn ein Kommentar öffentlich WIRD oder es nicht mehr IST.
	// Ein Wechsel von 'spam' zu 'trash' ändert an der Seite nichts.
	if ( 'approved' !== $new_status && 'approved' !== $old_status ) {
		return;
	}

	if ( ! $comment instanceof WP_Comment || ! eddy_cr_is_plain_comment( $comment->comment_type ) ) {
		return;
	}

	eddy_cr_queue( (int) $comment->comment_post_ID );
}

add_action( 'deleted_comment', 'eddy_cr_on_deleted', 10, 2 );

/**
 * Ein Kommentar wurde endgültig gelöscht. Dabei feuert kein Statuswechsel, deshalb
 * dieser eigene Haken — sonst bliebe ein gelöschter Kommentar auf der Nuxt-Seite stehen.
 *
 * @param int        $comment_id Unbenutzt.
 * @param WP_Comment $comment    Der gelöschte Kommentar.
 */
function eddy_cr_on_deleted( $comment_id, $comment ) {
	if ( ! $comment instanceof WP_Comment || ! eddy_cr_is_plain_comment( $comment->comment_type ) ) {
		return;
	}

	eddy_cr_queue( (int) $comment->comment_post_ID );
}

/**
 * Normale Leserkommentare haben den Typ 'comment' (seit WP 5.5) oder einen leeren
 * Typ (älter). Alles andere sind Pingbacks/Trackbacks.
 *
 * @param string $type Wert aus comment_type.
 * @return bool
 */
function eddy_cr_is_plain_comment( $type ) {
	return '' === $type || 'comment' === $type;
}

/* -------------------------------------------------------------------------
 * Auslöser: Beiträge
 * ---------------------------------------------------------------------- */

add_action( 'transition_post_status', 'eddy_cr_on_post_status_change', 10, 3 );

/**
 * Ein Beitrag wurde veröffentlicht, bearbeitet, zurückgezogen oder in den Papierkorb gelegt.
 *
 * transition_post_status feuert auch bei publish → publish, deckt also die reine
 * Bearbeitung eines veröffentlichten Beitrags mit ab.
 *
 * @param string  $new_status Neuer Status.
 * @param string  $old_status Bisheriger Status.
 * @param WP_Post $post       Der Beitrag.
 */
function eddy_cr_on_post_status_change( $new_status, $old_status, $post ) {
	if ( ! $post instanceof WP_Post || 'post' !== $post->post_type ) {
		return;
	}

	// Revisionen und Autosaves sind eigene Datensätze. Ohne diese Prüfung feuerte der
	// Webhook bei jedem Zwischenspeichern im Editor.
	if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
		return;
	}

	// Ein frisch geöffneter, leerer Editor legt einen auto-draft an. Der hat nie eine
	// öffentliche Seite gehabt und bekommt auch keine.
	if ( 'auto-draft' === $new_status || 'auto-draft' === $old_status ) {
		return;
	}

	// Relevant ist nur, wenn ein Beitrag öffentlich WIRD, es BLEIBT (Bearbeitung) oder es
	// nicht mehr IST. Ein Entwurf, der Entwurf bleibt, ändert an der Webseite nichts.
	if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
		return;
	}

	// Der Slug ist hier noch sauber: wp_trash_post hängt das Suffix „__trashed" erst NACH
	// dem Statuswechsel an.
	eddy_cr_queue( (int) $post->ID, 'post', (string) $post->post_name );
}

add_action( 'deleted_post', 'eddy_cr_on_post_deleted', 10, 2 );

/**
 * Ein Beitrag wurde endgültig gelöscht.
 *
 * Bewusst NUR für Beiträge, die dabei noch auf „publish" standen — also direkt gelöscht,
 * ohne Umweg über den Papierkorb. Wer über den Papierkorb geht, hat den Webhook schon beim
 * Statuswechsel ausgelöst, und sein Slug trägt hier bereits das Suffix „__trashed", wäre
 * als Pfad also ohnehin falsch.
 *
 * @param int     $post_id Beitrag.
 * @param WP_Post $post    Der gelöschte Beitrag.
 */
function eddy_cr_on_post_deleted( $post_id, $post ) {
	if ( ! $post instanceof WP_Post || 'post' !== $post->post_type ) {
		return;
	}

	if ( 'publish' !== $post->post_status ) {
		return;
	}

	eddy_cr_queue( (int) $post_id, 'post', (string) $post->post_name );
}

/* -------------------------------------------------------------------------
 * Versand
 * ---------------------------------------------------------------------- */

/**
 * Plant den Webhook, statt ihn sofort zu senden.
 *
 * Zwei Gründe: Wer gerade kommentiert oder einen Beitrag speichert, soll nicht auf einen
 * fremden Server warten, und wp_schedule_single_event plant denselben Hook mit denselben
 * Argumenten innerhalb von zehn Minuten nur einmal ein. Ein Vorgang, der gleich zwei der
 * obigen Haken auslöst, erzeugt dadurch trotzdem nur einen Aufruf.
 *
 * @param int    $post_id Beitrag, dessen Seite neu gebaut werden soll.
 * @param string $scope   'comment' = nur die Beitragsseite, 'post' = zusätzlich die Übersicht.
 * @param string $slug    Slug des Beitrags. Wird immer mitgeschickt, weil die WordPress-API
 *                        einen gelöschten oder zurückgezogenen Beitrag nicht mehr herausgibt
 *                        (404 bzw. 401) — dann ist das hier die einzige Quelle für den Pfad,
 *                        der aus dem Cache verschwinden muss.
 */
function eddy_cr_queue( $post_id, $scope = 'comment', $slug = '' ) {
	$post_id = (int) $post_id;

	if ( $post_id <= 0 ) {
		return;
	}

	if ( '' === $slug ) {
		$slug = eddy_cr_slug_of( $post_id );
	}

	$args = array( $post_id, $scope, $slug );

	if ( ! wp_next_scheduled( EDDY_CR_EVENT, $args ) ) {
		wp_schedule_single_event( time() + 5, EDDY_CR_EVENT, $args );
	}
}

/**
 * Liest den Slug eines Beitrags direkt aus der Datenbank.
 *
 * get_post_field statt get_permalink: Gebraucht wird nur `post_name`, und der bleibt auch
 * dann lesbar, wenn der Beitrag im Papierkorb liegt.
 *
 * @param int $post_id Beitrag.
 * @return string Slug oder leerer String.
 */
function eddy_cr_slug_of( $post_id ) {
	$slug = get_post_field( 'post_name', (int) $post_id );

	return is_string( $slug ) ? $slug : '';
}

add_action( EDDY_CR_EVENT, 'eddy_cr_send', 10, 3 );

/**
 * Schickt den Webhook an die Nuxt-Seite und merkt sich das Ergebnis für die
 * Einstellungsseite.
 *
 * Die Gegenstelle holt sich den Slug bevorzugt selbst bei WordPress, damit kein
 * Fremdstring in die URL wandert, die sie anschließend aufruft. Der hier mitgeschickte
 * Slug ist nur die Rückfallebene für Beiträge, die es dort nicht mehr gibt.
 *
 * @param int    $post_id Beitrag.
 * @param string $scope   'comment' oder 'post'.
 * @param string $slug    Slug als Rückfallebene.
 * @return bool Ob der Aufruf erfolgreich war.
 */
function eddy_cr_send( $post_id, $scope = 'comment', $slug = '' ) {
	$endpoint = trim( (string) get_option( EDDY_CR_OPTION_ENDPOINT, '' ) );
	$secret   = (string) get_option( EDDY_CR_OPTION_SECRET, '' );

	if ( '' === $endpoint || '' === $secret ) {
		eddy_cr_remember( $post_id, 0, 'Endpoint oder Secret fehlt — bitte unter Einstellungen → Kommentar-Webhook eintragen.' );
		return false;
	}

	$response = wp_remote_post(
		$endpoint,
		array(
			'timeout'  => 20,
			'blocking' => true,
			'headers'  => array(
				'Content-Type'        => 'application/json',
				'X-Revalidate-Secret' => $secret,
			),
			'body'     => wp_json_encode(
				array(
					'postId' => (int) $post_id,
					'scope'  => 'post' === $scope ? 'post' : 'comment',
					'slug'   => (string) $slug,
				)
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		eddy_cr_remember( $post_id, 0, $response->get_error_message() );
		return false;
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	eddy_cr_remember( $post_id, $code, trim( (string) wp_remote_retrieve_body( $response ) ) );

	return $code >= 200 && $code < 300;
}

/**
 * Hält das letzte Ergebnis fest. Ohne das wäre ein fehlgeschlagener Webhook unsichtbar:
 * er läuft im Hintergrund, niemand sieht eine Fehlermeldung.
 *
 * @param int    $post_id Beitrag.
 * @param int    $code    HTTP-Status, 0 wenn gar keine Antwort kam.
 * @param string $message Antworttext oder Fehlermeldung.
 */
function eddy_cr_remember( $post_id, $code, $message ) {
	update_option(
		EDDY_CR_OPTION_LAST,
		array(
			'time'    => time(),
			'post_id' => (int) $post_id,
			'code'    => (int) $code,
			'message' => substr( (string) $message, 0, 500 ),
		),
		false
	);
}

/* -------------------------------------------------------------------------
 * Einstellungsseite
 *
 * Endpoint und Secret stehen bewusst NICHT im Code: Das Plugin soll sich hochladen
 * lassen, ohne dass ein Geheimnis in einer Datei landet.
 * ---------------------------------------------------------------------- */

add_action( 'admin_init', 'eddy_cr_migrate_endpoint' );

/**
 * Übernimmt die Adresse aus Version 1.0.
 *
 * Dort hieß die Gegenstelle noch `/api/revalidate-comments`, weil sie nur Kommentare
 * kannte. Ohne diese Umstellung liefe der Webhook nach dem Update auf einen 404, und zwar
 * still — gemerkt hätte man es erst am ausbleibenden Ergebnis.
 */
function eddy_cr_migrate_endpoint() {
	$endpoint = (string) get_option( EDDY_CR_OPTION_ENDPOINT, '' );

	if ( '' === $endpoint || false === strpos( $endpoint, '/api/revalidate-comments' ) ) {
		return;
	}

	update_option(
		EDDY_CR_OPTION_ENDPOINT,
		str_replace( '/api/revalidate-comments', '/api/revalidate', $endpoint )
	);
}

add_action( 'admin_menu', 'eddy_cr_add_settings_page' );

function eddy_cr_add_settings_page() {
	add_options_page(
		'Inhalts-Webhook',
		'Inhalts-Webhook',
		'manage_options',
		'eddy-comment-revalidate',
		'eddy_cr_render_settings_page'
	);
}

add_action( 'admin_init', 'eddy_cr_register_settings' );

function eddy_cr_register_settings() {
	register_setting(
		'eddy_cr_settings',
		EDDY_CR_OPTION_ENDPOINT,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'eddy_cr_sanitize_endpoint',
			'default'           => '',
		)
	);

	register_setting(
		'eddy_cr_settings',
		EDDY_CR_OPTION_SECRET,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'eddy_cr_sanitize_secret',
			'default'           => '',
		)
	);
}

/**
 * Nur HTTPS-URLs zulassen: Über diese Verbindung geht das Shared Secret.
 *
 * @param string $value Eingabe aus dem Formular.
 * @return string Geprüfte URL oder der bisherige Wert.
 */
function eddy_cr_sanitize_endpoint( $value ) {
	$value = trim( (string) $value );

	if ( '' === $value ) {
		return '';
	}

	$clean = esc_url_raw( $value, array( 'https' ) );

	if ( '' === $clean ) {
		add_settings_error(
			EDDY_CR_OPTION_ENDPOINT,
			'eddy_cr_endpoint_invalid',
			'Der Endpoint muss eine vollständige https-Adresse sein. Der bisherige Wert wurde behalten.'
		);

		return (string) get_option( EDDY_CR_OPTION_ENDPOINT, '' );
	}

	return $clean;
}

/**
 * Ein leeres Feld löscht das Secret NICHT.
 *
 * Das Eingabefeld ist ein Passwortfeld; ein Browser oder Passwortmanager, der es leer
 * lässt, würde sonst beim nächsten Speichern den Webhook stillschweigend abschalten.
 *
 * @param string $value Eingabe aus dem Formular.
 * @return string
 */
function eddy_cr_sanitize_secret( $value ) {
	$value = trim( (string) $value );

	if ( '' === $value ) {
		return (string) get_option( EDDY_CR_OPTION_SECRET, '' );
	}

	return sanitize_text_field( $value );
}

function eddy_cr_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$last = get_option( EDDY_CR_OPTION_LAST, array() );
	?>
	<div class="wrap">
		<h1>Inhalts-Webhook</h1>

		<p>
			Meldet Änderungen an eduard-andrae.de, damit die betroffenen Seiten dort sofort
			neu gebaut werden. Ohne diese Meldung dauert es bis zu mehrere Stunden, bis eine
			Änderung sichtbar wird.
		</p>

		<p>Gemeldet wird:</p>

		<ul style="list-style:disc;margin-left:1.5rem">
			<li>Ein Kommentar kommt dazu, wird freigegeben, gelöscht oder als Spam markiert
				— dann wird die Seite des Beitrags neu gebaut.</li>
			<li>Ein Beitrag wird veröffentlicht, bearbeitet, zurückgezogen oder gelöscht
				— dann zusätzlich die Beitragsübersicht.</li>
		</ul>

		<form method="post" action="options.php">
			<?php settings_fields( 'eddy_cr_settings' ); ?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="eddy_cr_endpoint">Endpoint</label></th>
					<td>
						<input
							type="url"
							id="eddy_cr_endpoint"
							name="<?php echo esc_attr( EDDY_CR_OPTION_ENDPOINT ); ?>"
							value="<?php echo esc_attr( get_option( EDDY_CR_OPTION_ENDPOINT, '' ) ); ?>"
							class="regular-text"
							placeholder="https://eduard-andrae.de/api/revalidate"
						>
						<p class="description">Vollständige https-Adresse der Revalidate-Route.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="eddy_cr_secret">Secret</label></th>
					<td>
						<input
							type="password"
							id="eddy_cr_secret"
							name="<?php echo esc_attr( EDDY_CR_OPTION_SECRET ); ?>"
							value="<?php echo esc_attr( get_option( EDDY_CR_OPTION_SECRET, '' ) ); ?>"
							class="regular-text"
							autocomplete="new-password"
						>
						<p class="description">
							Muss exakt dem Wert von <code>NUXT_REVALIDATE_SECRET</code> in Vercel
							entsprechen. Ein leeres Feld löscht den gespeicherten Wert nicht.
						</p>
					</td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>

		<h2>Letzter Versand</h2>

		<?php if ( empty( $last ) ) : ?>
			<p>Noch kein Webhook gesendet.</p>
		<?php else : ?>
			<table class="widefat striped" style="max-width:48rem">
				<tbody>
					<tr>
						<th scope="row" style="width:10rem">Zeitpunkt</th>
						<td>
							<?php
							echo esc_html(
								wp_date( 'd.m.Y H:i:s', isset( $last['time'] ) ? (int) $last['time'] : 0 )
							);
							?>
						</td>
					</tr>
					<tr>
						<th scope="row">Beitrag</th>
						<td>
							<?php
							$last_post_id = isset( $last['post_id'] ) ? (int) $last['post_id'] : 0;
							$title        = $last_post_id > 0 ? get_the_title( $last_post_id ) : '';
							echo esc_html( '' !== $title ? $title . ' (ID ' . $last_post_id . ')' : 'ID ' . $last_post_id );
							?>
						</td>
					</tr>
					<tr>
						<th scope="row">Status</th>
						<td>
							<?php
							$code = isset( $last['code'] ) ? (int) $last['code'] : 0;
							$ok   = $code >= 200 && $code < 300;
							printf(
								'<strong style="color:%s">%s</strong>',
								esc_attr( $ok ? '#1a7f37' : '#b32d2e' ),
								esc_html( $ok ? 'OK (' . $code . ')' : ( 0 === $code ? 'Fehler' : 'Fehler (' . $code . ')' ) )
							);
							?>
						</td>
					</tr>
					<tr>
						<th scope="row">Antwort</th>
						<td><code><?php echo esc_html( isset( $last['message'] ) ? $last['message'] : '' ); ?></code></td>
					</tr>
				</tbody>
			</table>
		<?php endif; ?>

		<h2>Verbindung testen</h2>

		<p>
			Schickt sofort einen Webhook für den zuletzt veröffentlichten Beitrag und zeigt
			das Ergebnis oben an. Ändert nichts an den Inhalten.
		</p>

		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="eddy_cr_test">
			<?php wp_nonce_field( 'eddy_cr_test' ); ?>
			<?php submit_button( 'Jetzt testen', 'secondary', 'submit', false ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_eddy_cr_test', 'eddy_cr_handle_test' );

function eddy_cr_handle_test() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Keine Berechtigung.' );
	}

	check_admin_referer( 'eddy_cr_test' );

	$posts = get_posts(
		array(
			'numberposts' => 1,
			'post_status' => 'publish',
			'post_type'   => 'post',
		)
	);

	if ( empty( $posts ) ) {
		eddy_cr_remember( 0, 0, 'Kein veröffentlichter Beitrag zum Testen gefunden.' );
	} else {
		// Bewusst mit Geltungsbereich 'post': Das prüft alle vier Pfade auf einmal
		// (Beitragsseite, Übersicht und beider Payload-Dateien), nicht nur zwei.
		eddy_cr_send( (int) $posts[0]->ID, 'post', (string) $posts[0]->post_name );
	}

	wp_safe_redirect( admin_url( 'options-general.php?page=eddy-comment-revalidate' ) );
	exit;
}

/**
 * Beim Deaktivieren keine Karteileiche hinterlassen: ein noch eingeplanter Webhook
 * würde sonst ins Leere laufen.
 */
register_deactivation_hook( __FILE__, 'eddy_cr_on_deactivate' );

function eddy_cr_on_deactivate() {
	// wp_unschedule_hook statt wp_clear_scheduled_hook: die geplanten Ereignisse tragen
	// die Post-ID als Argument, und clear würde nur die mit exakt passenden Argumenten
	// treffen. unschedule_hook räumt alle ab.
	wp_unschedule_hook( EDDY_CR_EVENT );
}
