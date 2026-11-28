<?php
/**
 * Plugin Name: Headless-Weiterleitung für eduard-andrae.de
 * Description: Leitet Leser des WordPress-Frontends per 301 auf die gleiche Seite unter eduard-andrae.de um und nimmt deren Kommentare über die REST-API an. WordPress bleibt Redaktionssystem, REST-API und Bildquelle. Mit Testmodus, der nur einen Header setzt.
 * Version:     1.3.1
 * Author:      Eduard Andrae
 * License:     GPL-2.0-or-later
 *
 * Konzept, Zuordnungstabelle und Begründung: docs/headless-wordpress.md im Repo
 * eduard-andrae-website. Prüfskript: scripts/check-headless-redirect.mjs dort.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const EDDY_HR_OPTION_MODE = 'eddy_hr_mode';
const EDDY_HR_SITE        = 'https://eduard-andrae.de';

/** Aus: tut nichts. Test: setzt nur Header. Live: leitet per 301 um. */
const EDDY_HR_MODES = array( 'off', 'test', 'live' );

/**
 * Seiten mit eigenem Ziel. Jede andere Seite geht auf /blog.
 * Entscheidungen von Eddy, Stand 12.11.2026 (docs/headless-wordpress.md).
 */
const EDDY_HR_PAGE_TARGETS = array(
	'impressum'   => '/impressum',
	'disclaimer'  => '/datenschutz',
	'statistik'   => '/statistik',
	'gewichtiges' => '/statistik',
);

register_activation_hook( __FILE__, 'eddy_hr_activate' );

/**
 * Erste Aktivierung startet im Testmodus, nie scharf. add_option ändert einen
 * vorhandenen Wert nicht, eine Neuinstallation über ein bestehendes Plugin behält
 * also die gewählte Stellung.
 */
function eddy_hr_activate() {
	add_option( EDDY_HR_OPTION_MODE, 'test' );
}

/**
 * @return string Eine der Stellungen aus EDDY_HR_MODES.
 */
function eddy_hr_mode() {
	$mode = (string) get_option( EDDY_HR_OPTION_MODE, 'test' );

	return in_array( $mode, EDDY_HR_MODES, true ) ? $mode : 'test';
}

/* -------------------------------------------------------------------------
 * Weiterleitung
 *
 * Priorität 1: vor redirect_canonical und wp_old_slug_redirect (beide 10). So
 * springt ?p=123 direkt zur Nuxt-Seite statt erst zur WordPress-Adresse.
 * ---------------------------------------------------------------------- */

add_action( 'template_redirect', 'eddy_hr_template_redirect', 1 );

function eddy_hr_template_redirect() {
	$mode = eddy_hr_mode();

	if ( 'off' === $mode ) {
		return;
	}

	$decision = eddy_hr_decide();

	if ( 'test' === $mode ) {
		if ( null !== $decision['target'] ) {
			header( 'X-Eddy-Redirect: ' . $decision['target'] );
		} else {
			header( 'X-Eddy-Redirect-Skip: ' . $decision['skip'] );
		}

		return;
	}

	if ( null !== $decision['target'] ) {
		wp_redirect( $decision['target'], 301, 'Eddy Headless' );
		exit;
	}
}

/**
 * Entscheidet, ob und wohin die aktuelle Anfrage umgeleitet wird.
 *
 * Positivliste: Umgeleitet wird nur, was WordPress als Inhalt erkannt hat. Eine 404
 * NIE, denn app/pages/[...slug].vue auf eduard-andrae.de schickt unbekannte Pfade
 * hierher zurück; beides zusammen wäre eine Endlosschleife.
 *
 * @return array{target: ?string, skip: string} Ziel als absolute URL oder null mit Grund.
 */
function eddy_hr_decide() {
	$method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( (string) $_SERVER['REQUEST_METHOD'] ) : 'GET';

	// Kommentarformular, XML-RPC und Co. schicken POST; die dürfen nie umgeleitet werden.
	if ( 'GET' !== $method && 'HEAD' !== $method ) {
		return eddy_hr_skip( 'methode' );
	}

	// Vorschau-Knopf im Editor: Entwürfe (`?p=…&preview=true`) und Änderungen an
	// veröffentlichten Beiträgen (`?preview_id=…&preview=true`) setzen beide is_preview().
	// Eine eigene Ausnahme für Angemeldete gibt es seit 1.2.0 nicht mehr (13.11.2026): Sie
	// war für die Vorschau überflüssig und ließ Eddy im angemeldeten Browser glauben, die
	// Weiterleitung funktioniere nicht.
	if ( is_preview() || is_customize_preview() ) {
		return eddy_hr_skip( 'vorschau' );
	}

	// Sitemaps des Blogs gehen auf die Sitemap der Nuxt-Seite. Feste Zuordnung über den
	// Pfad und bewusst VOR der 404-Prüfung: Seit The SEO Framework gelöscht ist (13.11.2026),
	// hält WordPress /sitemap.xml je nach Stand der Rewrite-Regeln für die Startseite oder
	// für eine 404. Eine Schleife ist ausgeschlossen, weil eduard-andrae.de/sitemap.xml eine
	// echte Datei ist und nie bei der Catch-all-Route landet.
	if ( eddy_hr_is_sitemap_path( eddy_hr_request_path() ) ) {
		return eddy_hr_target( '/sitemap.xml' );
	}

	if ( is_404() ) {
		return eddy_hr_skip( '404' );
	}

	if ( is_feed() ) {
		return eddy_hr_skip( 'feed' );
	}

	if ( is_robots() || ( function_exists( 'is_favicon' ) && is_favicon() ) ) {
		return eddy_hr_skip( 'maschinendatei' );
	}

	// Embeds werden als iframe auf fremden Seiten angezeigt; eine Weiterleitung auf eine
	// ganze Seite gehört da nicht hinein.
	if ( is_embed() ) {
		return eddy_hr_skip( 'embed' );
	}

	if ( is_trackback() ) {
		return eddy_hr_skip( 'trackback' );
	}

	if ( '' !== (string) get_query_var( 'sitemap' ) || '' !== (string) get_query_var( 'sitemap-stylesheet' ) ) {
		return eddy_hr_skip( 'sitemap' );
	}

	if ( is_singular() ) {
		return eddy_hr_decide_singular( get_queried_object() );
	}

	if ( is_search() ) {
		$term = trim( (string) get_search_query( false ) );

		return eddy_hr_target( '' === $term ? '/blog' : '/blog?q=' . rawurlencode( $term ) );
	}

	if ( is_home() || is_front_page() || is_archive() ) {
		return eddy_hr_target( '/blog' );
	}

	return eddy_hr_skip( 'unbekannt' );
}

/**
 * @param mixed $object Ergebnis von get_queried_object().
 * @return array{target: ?string, skip: string}
 */
function eddy_hr_decide_singular( $object ) {
	if ( ! $object instanceof WP_Post ) {
		return eddy_hr_skip( 'kein-beitrag' );
	}

	// Anhangseite: der Beitrag, an dem das Bild hängt.
	if ( 'attachment' === $object->post_type ) {
		$parent = $object->post_parent ? get_post( $object->post_parent ) : null;

		if ( $parent instanceof WP_Post && 'post' === $parent->post_type && 'publish' === $parent->post_status ) {
			return eddy_hr_target( eddy_hr_post_path( $parent ) );
		}

		return eddy_hr_target( '/blog' );
	}

	// Nicht öffentlich (privat, Entwurf) sehen nur Angemeldete. Die Nuxt-Seite zeigt nur
	// Veröffentlichtes, eine Umleitung führte dort auf eine 404. Also auf WordPress bleiben.
	if ( 'publish' !== $object->post_status ) {
		return eddy_hr_skip( 'nicht-oeffentlich' );
	}

	if ( 'post' === $object->post_type ) {
		return eddy_hr_target( eddy_hr_post_path( $object ) );
	}

	if ( 'page' === $object->post_type ) {
		$slug = (string) $object->post_name;

		return eddy_hr_target( isset( EDDY_HR_PAGE_TARGETS[ $slug ] ) ? EDDY_HR_PAGE_TARGETS[ $slug ] : '/blog' );
	}

	return eddy_hr_target( '/blog' );
}

/**
 * @return string Pfad der Anfrage ohne Query, z. B. `/sitemap.xml`.
 */
function eddy_hr_request_path() {
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '/';
	$path = wp_parse_url( $uri, PHP_URL_PATH );

	return is_string( $path ) ? $path : '/';
}

/**
 * Sitemap-Adressen, die The SEO Framework (`/sitemap.xml`) und WordPress selbst
 * (`/wp-sitemap.xml`, `/wp-sitemap-posts-post-1.xml`, …) bedient haben.
 *
 * @param string $path Pfad der Anfrage.
 * @return bool
 */
function eddy_hr_is_sitemap_path( $path ) {
	return 1 === preg_match( '#^/(wp-)?sitemap[a-z0-9_-]*\.xml$#i', $path );
}

/**
 * Pfad eines Beitrags auf der Nuxt-Seite.
 *
 * WordPress speichert Sonderzeichen-Slugs kodiert mit kleinen Hex-Ziffern
 * (`%e2%88%92`). Neu kodiert ergibt das große Hex-Ziffern, genau wie Canonical und
 * Sitemap der Nuxt-Seite (shared/utils/canonical-url.ts). Ziel und Canonical sind damit
 * Zeichen für Zeichen gleich.
 *
 * @param WP_Post $post Veröffentlichter Beitrag.
 * @return string
 */
function eddy_hr_post_path( WP_Post $post ) {
	$slug = (string) $post->post_name;

	if ( '' === $slug ) {
		return '/blog';
	}

	return '/blog/' . rawurlencode( rawurldecode( $slug ) );
}

/**
 * @param string $path Pfad auf eduard-andrae.de, mit führendem Schrägstrich.
 * @return array{target: string, skip: string}
 */
function eddy_hr_target( $path ) {
	return array(
		'target' => EDDY_HR_SITE . $path,
		'skip'   => '',
	);
}

/**
 * @param string $reason Kurzer Grund für den Test-Header.
 * @return array{target: null, skip: string}
 */
function eddy_hr_skip( $reason ) {
	return array(
		'target' => null,
		'skip'   => $reason,
	);
}

/* -------------------------------------------------------------------------
 * Kommentare von eduard-andrae.de annehmen (seit 1.3.0)
 *
 * Mit der Weiterleitung ist das Kommentarformular des Themes nicht mehr erreichbar:
 * /<slug>/#respond landet auf der Nuxt-Seite. Deren eigenes Formular sendet hierher,
 * direkt aus dem Browser des Lesers, damit Akismet und die Flood-Prüfung seine
 * IP-Adresse sehen und nicht die eines Servers.
 *
 * Bewusst nicht POST /wp/v2/comments mit dem Filter rest_allow_anonymous_comments: Die
 * Kern-Route speichert über wp_insert_comment() und löst den Haken comment_post nicht
 * aus. An dem hängen die Benachrichtigungsmails von WordPress und der Inhalts-Webhook
 * (Plugin eddy-comment-revalidate). wp_handle_comment_submission() ist die Funktion, die
 * auch wp-comments-post.php aufruft, also exakt der Weg des alten Formulars.
 *
 * Kein neues Einfallstor: wp-comments-post.php nimmt Gast-Kommentare ohnehin von jedem
 * an, mit denselben Prüfungen davor. Die Route läuft unabhängig von der Stellung des
 * Plugins, weil die Nuxt-Seite ihr Formular immer zeigt.
 *
 * Gegenstück: app/composables/useCommentForm.ts, docs/blog-kommentare.md.
 * ---------------------------------------------------------------------- */

add_action( 'rest_api_init', 'eddy_hr_register_comment_route' );

function eddy_hr_register_comment_route() {
	register_rest_route(
		'eddy-headless/v1',
		'/kommentare',
		array(
			'methods'             => 'POST',
			'callback'            => 'eddy_hr_create_comment',
			// Öffentlich wie wp-comments-post.php. Ob kommentiert werden darf, entscheidet
			// wp_handle_comment_submission() (Beitrag offen, Pflichtfelder, Registrierungszwang).
			'permission_callback' => '__return_true',
			'args'                => array(
				'post'         => array(
					'type'     => 'integer',
					'required' => true,
					'minimum'  => 1,
				),
				'parent'       => array(
					'type'    => 'integer',
					'default' => 0,
					'minimum' => 0,
				),
				'author_name'  => array(
					'type'    => 'string',
					'default' => '',
				),
				'author_email' => array(
					'type'    => 'string',
					'default' => '',
				),
				'author_url'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'content'      => array(
					'type'     => 'string',
					'required' => true,
				),
				// Zeitpunkt (ms), zu dem das Formular im Browser geöffnet wurde. Nur für Akismet.
				'form_opened_at' => array(
					'type'    => 'integer',
					'default' => 0,
				),
			),
		)
	);
}

/**
 * @param WP_REST_Request $request Anfrage des Formulars auf eduard-andrae.de.
 * @return WP_REST_Response|WP_Error 201 mit id und status, sonst der Fehler aus WordPress.
 */
function eddy_hr_create_comment( WP_REST_Request $request ) {
	// Was Akismet über diese Anfrage wissen muss, siehe eddy_hr_akismet_request_args().
	eddy_hr_comment_context(
		array(
			'permalink' => eddy_hr_public_permalink( (int) $request['post'] ),
			'opened_at' => eddy_hr_plausible_opened_at( $request['form_opened_at'] ),
		)
	);

	add_filter( 'akismet_comment_nonce', 'eddy_hr_akismet_nonce_inactive' );
	add_filter( 'akismet_request_args', 'eddy_hr_akismet_request_args', 10, 2 );

	// REST-Parameter sind bereits ohne Maskierung, genau wie wp_handle_comment_submission()
	// sie erwartet (wp-comments-post.php ruft vorher wp_unslash() auf).
	$comment = wp_handle_comment_submission(
		array(
			'comment_post_ID' => (int) $request['post'],
			'comment_parent'  => (int) $request['parent'],
			'author'          => (string) $request['author_name'],
			'email'           => (string) $request['author_email'],
			'url'             => (string) $request['author_url'],
			'comment'         => (string) $request['content'],
		)
	);

	remove_filter( 'akismet_comment_nonce', 'eddy_hr_akismet_nonce_inactive' );
	remove_filter( 'akismet_request_args', 'eddy_hr_akismet_request_args', 10 );
	eddy_hr_comment_context( array() );

	if ( is_wp_error( $comment ) ) {
		return new WP_Error(
			$comment->get_error_code(),
			wp_strip_all_tags( $comment->get_error_message() ),
			array( 'status' => eddy_hr_comment_error_status( $comment ) )
		);
	}

	// Sollte nicht vorkommen: wp_handle_comment_submission() liefert WP_Comment oder WP_Error.
	if ( ! $comment instanceof WP_Comment ) {
		return new WP_Error( 'comment_save_error', 'Der Kommentar konnte nicht gespeichert werden.', array( 'status' => 500 ) );
	}

	if ( 'spam' === (string) $comment->comment_approved ) {
		eddy_hr_notify_spam( $comment );
	}

	return new WP_REST_Response(
		array(
			'id'     => (int) $comment->comment_ID,
			// comment_approved ist '1', '0', 'spam' oder 'trash'. Alles außer '1' ist für den
			// Absender dasselbe: noch nicht sichtbar. Ein Spamverdacht wird nicht verraten.
			'status' => '1' === (string) $comment->comment_approved ? 'approved' : 'hold',
		),
		201
	);
}

/* -------------------------------------------------------------------------
 * Akismet: was es über einen Kommentar von eduard-andrae.de erfährt (seit 1.3.1)
 *
 * Akismet erkennt das Kommentarformular des Themes an drei Dingen, die es selbst dort
 * einbaut: einem Nonce, einem per JavaScript gesetzten Zeitstempel (ak_js) und daran, dass
 * die verweisende Seite der Beitrag ist. Über diese Route fehlte alles drei. Akismet
 * meldete seinem Dienst „Nonce fehlgeschlagen“, kein JavaScript, und eine verweisende
 * Seite auf einer anderen Domain als der Beitrag: das Profil eines Skripts. Am 22.11. und
 * 28.11.2026 landeten zwei Kommentare aus dem Formular im Spam, einer davon von Eddy.
 *
 * Die Angaben unten sind wahr, nicht geschönt: Einen Nonce gibt es auf diesem Weg nicht
 * (also „inaktiv“ statt „fehlgeschlagen“), die öffentliche Adresse des Beitrags liegt auf
 * eduard-andrae.de, und den Zeitstempel setzt das Formular wirklich per JavaScript.
 *
 * Herleitung am Akismet-Quelltext: docs/blog-kommentare.md.
 * ---------------------------------------------------------------------- */

/**
 * Hält die Angaben zur laufenden Anfrage für die Akismet-Filter bereit.
 *
 * @param array|null $set Neue Angaben; null liest nur.
 * @return array{permalink?: string, opened_at?: int}
 */
function eddy_hr_comment_context( $set = null ) {
	static $context = array();

	if ( is_array( $set ) ) {
		$context = $set;
	}

	return $context;
}

/**
 * Akismet meldet „inactive“ statt „failed“: Das Formular auf eduard-andrae.de kann keinen
 * WordPress-Nonce tragen. Der Filter ist von Akismet dafür vorgesehen (jeder Wert außer
 * 'true' und '' schaltet den Nonce ab) und gilt nur, während diese Route läuft.
 *
 * @return string
 */
function eddy_hr_akismet_nonce_inactive() {
	return 'inactive';
}

/**
 * @param array  $args     Was Akismet an seinen Dienst schickt.
 * @param string $endpoint Akismet-Endpunkt, z. B. 'comment-check'.
 * @return array
 */
function eddy_hr_akismet_request_args( $args, $endpoint ) {
	if ( 'comment-check' !== $endpoint || ! is_array( $args ) ) {
		return $args;
	}

	$context = eddy_hr_comment_context();

	// get_permalink() liefert die WordPress-Adresse, die seit der Weiterleitung niemand mehr
	// sieht. Gelesen und kommentiert wird der Beitrag unter eduard-andrae.de/blog/<slug>.
	if ( ! empty( $context['permalink'] ) ) {
		$args['permalink'] = $context['permalink'];
	}

	// Dasselbe Feld, das Akismets eigenes Formular-Skript setzt: Zeitpunkt in Millisekunden,
	// zu dem JavaScript im Browser das Formular geöffnet hat.
	if ( ! empty( $context['opened_at'] ) ) {
		$args['POST_ak_js'] = (string) $context['opened_at'];
	}

	return $args;
}

/**
 * Öffentliche Adresse eines Beitrags auf der Nuxt-Seite.
 *
 * @param int $post_id Beitrags-ID aus der Anfrage.
 * @return string Adresse, oder '' wenn es kein veröffentlichter Beitrag ist.
 */
function eddy_hr_public_permalink( $post_id ) {
	$post = get_post( $post_id );

	if ( ! $post instanceof WP_Post || 'post' !== $post->post_type || 'publish' !== $post->post_status ) {
		return '';
	}

	return EDDY_HR_SITE . eddy_hr_post_path( $post );
}

/**
 * Prüft den Zeitstempel aus dem Formular. EXTERN: Nur ein Wert aus den letzten 24 Stunden
 * wird weitergegeben; alles andere (fehlend, Zukunft, uralt, keine Zahl) wird verworfen,
 * damit Akismet keinen erfundenen Wert bekommt.
 *
 * @param mixed $raw Millisekunden seit 1970, wie Date.now() im Browser.
 * @return int Zeitstempel in Millisekunden, oder 0.
 */
function eddy_hr_plausible_opened_at( $raw ) {
	if ( ! is_numeric( $raw ) ) {
		return 0;
	}

	$opened_at = (int) $raw;
	$now       = (int) round( microtime( true ) * 1000 );

	// Fünf Minuten Toleranz für eine vorgehende Uhr im Browser.
	if ( $opened_at > $now + 5 * 60 * 1000 || $opened_at < $now - 24 * 60 * 60 * 1000 ) {
		return 0;
	}

	return $opened_at;
}

/* -------------------------------------------------------------------------
 * Sicherheitsnetz: Mail, wenn ein Kommentar aus dem Formular im Spam landet (seit 1.3.1)
 *
 * WordPress benachrichtigt bei Spam niemanden, und der Absender sieht nur „wartet auf
 * Freigabe“. Ein fälschlich aussortierter Kommentar verschwände still. Deshalb eine kurze
 * Mail an den Autor des Beitrags. Der Kommentar bleibt im Spam: Erst der Klick auf „Kein
 * Spam“ meldet Akismet den Irrtum, und daraus lernt der Filter.
 *
 * Gilt nur für diese Route. Spam über wp-comments-post.php bleibt wie bisher stumm.
 * ---------------------------------------------------------------------- */

const EDDY_HR_SPAM_MAIL_LIMIT = 20;

/**
 * @param WP_Comment $comment Der eben als Spam gespeicherte Kommentar.
 */
function eddy_hr_notify_spam( WP_Comment $comment ) {
	// Höchstens 20 Mails am Tag, falls Bots die Route entdecken.
	$sent = (int) get_transient( 'eddy_hr_spam_mails' );

	if ( $sent >= EDDY_HR_SPAM_MAIL_LIMIT ) {
		return;
	}

	set_transient( 'eddy_hr_spam_mails', $sent + 1, DAY_IN_SECONDS );

	$post      = get_post( (int) $comment->comment_post_ID );
	$author    = $post instanceof WP_Post ? get_userdata( (int) $post->post_author ) : false;
	$recipient = $author && is_email( $author->user_email ) ? $author->user_email : get_option( 'admin_email' );

	if ( ! is_email( $recipient ) ) {
		return;
	}

	$title = $post instanceof WP_Post ? wp_strip_all_tags( get_the_title( $post ) ) : '(unbekannter Beitrag)';
	$name  = '' !== (string) $comment->comment_author ? (string) $comment->comment_author : '(ohne Namen)';

	// Reiner Text. Fremdtext wird von Tags befreit und gekürzt, es ist nur eine Vorschau.
	$excerpt = wp_html_excerpt( wp_strip_all_tags( (string) $comment->comment_content ), 500, ' […]' );

	$lines = array(
		'Ein Kommentar aus dem Formular auf eduard-andrae.de ist im Spam gelandet.',
		'',
		'Beitrag: ' . $title,
		'Name:    ' . $name,
		'',
		$excerpt,
		'',
		'Ist er echt? Dann im Spam-Ordner auf „Kein Spam“ klicken, daraus lernt Akismet:',
		admin_url( 'edit-comments.php?comment_status=spam' ),
		'',
		'Ist es wirklich Spam, ist nichts zu tun.',
	);

	wp_mail( $recipient, '[Blog] Kommentar im Spam: ' . $name, implode( "\n", $lines ) );
}

/**
 * HTTP-Status zu einem Fehler aus wp_handle_comment_submission().
 *
 * WordPress hängt den Status als Fehlerdaten an, aber für die Fehlerseite von
 * wp-comments-post.php gedacht: Pflichtfeld-Fehler tragen 200, manche gar keinen. Eine
 * REST-Antwort mit 200 würde das Formular als Erfolg lesen.
 *
 * @param WP_Error $error Fehler aus wp_handle_comment_submission().
 * @return int Status ab 400.
 */
function eddy_hr_comment_error_status( WP_Error $error ) {
	$status = (int) $error->get_error_data();

	if ( $status >= 400 && $status <= 599 ) {
		return $status;
	}

	return 'comment_id_not_found' === $error->get_error_code() ? 404 : 400;
}

/* -------------------------------------------------------------------------
 * Einstellungen
 * ---------------------------------------------------------------------- */

add_action( 'admin_menu', 'eddy_hr_add_settings_page' );

function eddy_hr_add_settings_page() {
	add_options_page(
		'Headless-Weiterleitung',
		'Headless-Weiterleitung',
		'manage_options',
		'eddy-headless-redirect',
		'eddy_hr_render_settings_page'
	);
}

add_action( 'admin_init', 'eddy_hr_register_settings' );

function eddy_hr_register_settings() {
	register_setting(
		'eddy_hr_settings',
		EDDY_HR_OPTION_MODE,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'eddy_hr_sanitize_mode',
			'default'           => 'test',
		)
	);
}

/**
 * @param mixed $value Eingabe aus dem Formular.
 * @return string Gültige Stellung, sonst die bisherige.
 */
function eddy_hr_sanitize_mode( $value ) {
	$value = (string) $value;

	return in_array( $value, EDDY_HR_MODES, true ) ? $value : eddy_hr_mode();
}

function eddy_hr_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$mode   = eddy_hr_mode();
	$labels = array(
		'off'  => array( 'Aus', 'Das Plugin tut nichts. Notschalter, ohne es deaktivieren zu müssen.' ),
		'test' => array( 'Testmodus', 'Keine Umleitung. Jede Seite bekommt nur den Header X-Eddy-Redirect mit dem Ziel, oder X-Eddy-Redirect-Skip mit dem Grund, warum sie nicht umgeleitet würde.' ),
		'live' => array( 'Aktiv', 'Leser werden per 301 auf eduard-andrae.de umgeleitet. Vorschau, private Beiträge, Feed, REST-API, Bilder und 404-Seiten bleiben unberührt.' ),
	);
	?>
	<div class="wrap">
		<h1>Headless-Weiterleitung</h1>

		<p>
			Schickt Leser dieses Blogs auf dieselbe Seite unter <code><?php echo esc_html( EDDY_HR_SITE ); ?></code>.
			WordPress bleibt Redaktionssystem; die Beiträge erscheinen nur noch dort.
		</p>

		<p>
			Kommentare schreiben Leser im Formular auf <code><?php echo esc_html( EDDY_HR_SITE ); ?></code>.
			Dieses Plugin nimmt sie über die REST-API an, in jeder Stellung.
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'eddy_hr_settings' ); ?>

			<fieldset>
				<legend class="screen-reader-text">Stellung</legend>
				<?php foreach ( $labels as $value => $label ) : ?>
					<p>
						<label>
							<input type="radio" name="<?php echo esc_attr( EDDY_HR_OPTION_MODE ); ?>" value="<?php echo esc_attr( $value ); ?>" <?php checked( $mode, $value ); ?> />
							<strong><?php echo esc_html( $label[0] ); ?></strong>
						</label>
						<br />
						<span class="description"><?php echo esc_html( $label[1] ); ?></span>
					</p>
				<?php endforeach; ?>
			</fieldset>

			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
