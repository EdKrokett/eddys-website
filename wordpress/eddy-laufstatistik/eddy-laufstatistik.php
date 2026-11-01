<?php
/**
 * Plugin Name: Laufstatistik für eduard-andrae.de
 * Description: Eddys Läufe seit 2006 als eigener Inhaltstyp mit Eingabemaske. Ersetzt die TablePress-Tabelle; angezeigt wird die Statistik auf eduard-andrae.de/statistik.
 * Version:     1.0.2
 * Author:      Eduard Andrae
 * License:     GPL-2.0-or-later
 *
 * Gegenstück: server/api/statistik.get.ts im Repo eduard-andrae-website.
 * Datenmodell und Begründung: docs/statistik.md dort.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const EDDY_LS_POST_TYPE = 'lauf';
const EDDY_LS_NONCE     = 'eddy_ls_nonce';
const EDDY_LS_LINK_ROWS = 6;

/**
 * Die festen Wertelisten. Schlüssel = gespeicherter Wert, Wert = Beschriftung im Formular.
 * Dieselben Schlüssel prüft parseLauf() in shared/utils/lauf.ts.
 */
function eddy_ls_choices() {
	return array(
		'art'      => array(
			'wettkampf'   => 'Wettkampf',
			'training'    => 'Trainingslauf',
			'meilenstein' => 'Meilenstein (ohne Distanz und Zeit)',
		),
		'ergebnis' => array(
			'finish' => 'Im Ziel',
			'dns'    => 'DNS (nicht gestartet)',
			'dnf'    => 'DNF (nicht im Ziel)',
		),
		'wertung'  => array(
			'einzel'    => 'Einzel',
			'staffel'   => 'Staffel',
			'triathlon' => 'Laufanteil eines Triathlons',
		),
	);
}

/* -------------------------------------------------------------------------
 * Inhaltstyp und Felder
 * ---------------------------------------------------------------------- */

add_action( 'init', 'eddy_ls_register' );

function eddy_ls_register() {
	register_post_type(
		EDDY_LS_POST_TYPE,
		array(
			'labels'             => array(
				'name'               => 'Läufe',
				'singular_name'      => 'Lauf',
				'menu_name'          => 'Läufe',
				'add_new'            => 'Lauf eintragen',
				'add_new_item'       => 'Neuen Lauf eintragen',
				'edit_item'          => 'Lauf bearbeiten',
				'new_item'           => 'Neuer Lauf',
				'search_items'       => 'Läufe durchsuchen',
				'not_found'          => 'Keine Läufe gefunden',
				'not_found_in_trash' => 'Keine Läufe im Papierkorb',
				'all_items'          => 'Alle Läufe',
			),
			// Keine eigene öffentliche Seite in WordPress: angezeigt wird auf eduard-andrae.de.
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'menu_position'      => 21,
			'menu_icon'          => 'dashicons-clock',
			// 'custom-fields' ist Pflicht, sonst verwirft wp/v2/laeufe jedes `meta` still: In 1.0.0
			// fehlte es, und der Import legte 68 Läufe ohne ein einziges Feld an (01.11.2026).
			// Den Standard-Kasten „Individuelle Felder“ blendet eddy_ls_add_meta_box() wieder aus.
			'supports'           => array( 'title', 'custom-fields' ),
			'show_in_rest'       => true,
			'rest_base'          => 'laeufe',
			'capability_type'    => 'post',
			'map_meta_cap'       => true,
		)
	);

	$choices = eddy_ls_choices();
	$can     = function () {
		return current_user_can( 'edit_posts' );
	};

	$string_fields = array(
		'datum'    => array(
			'description' => 'Datum im Format JJJJ-MM-TT',
			'pattern'     => '^\d{4}-\d{2}-\d{2}$',
		),
		'zeit'     => array(
			'description' => 'Zeit im Format H:MM:SS, leer bei DNS und Meilensteinen',
			'pattern'     => '^(\d{1,2}:[0-5]\d:[0-5]\d)?$',
		),
		'art'      => array( 'enum' => array_keys( $choices['art'] ) ),
		'ergebnis' => array( 'enum' => array_keys( $choices['ergebnis'] ) ),
		'wertung'  => array( 'enum' => array_keys( $choices['wertung'] ) ),
		'notiz'    => array( 'description' => 'Freitext, z. B. „ausgefallen (Corona)“' ),
	);

	foreach ( $string_fields as $key => $schema ) {
		register_post_meta(
			EDDY_LS_POST_TYPE,
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'sanitize_callback' => 'notiz' === $key ? 'eddy_ls_sanitize_text' : 'eddy_ls_sanitize_plain',
				'auth_callback'     => $can,
				'show_in_rest'      => array( 'schema' => array_merge( array( 'type' => 'string' ), $schema ) ),
			)
		);
	}

	register_post_meta(
		EDDY_LS_POST_TYPE,
		'distanz_km',
		array(
			'type'              => 'number',
			'single'            => true,
			'sanitize_callback' => 'eddy_ls_sanitize_distance_meta',
			'auth_callback'     => $can,
			'show_in_rest'      => array(
				'schema' => array(
					'type'    => 'number',
					'minimum' => 0,
					'maximum' => 1000,
				),
			),
		)
	);

	register_post_meta(
		EDDY_LS_POST_TYPE,
		'links',
		array(
			'type'              => 'array',
			'single'            => true,
			'sanitize_callback' => 'eddy_ls_sanitize_links',
			'auth_callback'     => $can,
			'show_in_rest'      => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'properties'           => array(
							'label' => array( 'type' => 'string' ),
							'url'   => array( 'type' => 'string' ),
						),
					),
				),
			),
		)
	);
}

function eddy_ls_sanitize_plain( $value ) {
	return trim( sanitize_text_field( (string) $value ) );
}

/**
 * Freitext für die Datenbank. Die Meta-Tabelle dieser Installation hat den Zeichensatz utf8,
 * nicht utf8mb4: Ein Emoji („öhm, kein Kommentar 🙁“) ließ das Speichern mit
 * `rest_meta_database_error` scheitern (01.11.2026). wp_encode_emoji() macht daraus eine
 * HTML-Entität, wie WordPress es bei Beiträgen selbst tut; eddy_ls_decode() dreht es für
 * Formular und Schnittstelle zurück.
 */
function eddy_ls_sanitize_text( $value ) {
	return wp_encode_emoji( trim( sanitize_text_field( (string) $value ) ) );
}

function eddy_ls_decode( $value ) {
	return html_entity_decode( (string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}

function eddy_ls_sanitize_distance_meta( $value ) {
	$parsed = eddy_ls_parse_distance( $value );

	return null === $parsed ? 0 : $parsed;
}

/**
 * Bereinigt die Linkliste: Einträge ohne Bezeichnung fallen weg, URLs nur mit http(s).
 * Ein Link ohne URL bleibt als reine Beschriftung stehen (z. B. „Polar“, wenn die alte
 * Aufzeichnung nicht mehr online ist).
 *
 * @param mixed $value Rohwert aus Formular oder REST.
 * @return array<int, array{label: string, url: string}>
 */
function eddy_ls_sanitize_links( $value ) {
	if ( ! is_array( $value ) ) {
		return array();
	}

	$links = array();

	foreach ( $value as $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}

		$label = isset( $item['label'] ) ? eddy_ls_sanitize_text( $item['label'] ) : '';
		$url   = isset( $item['url'] ) ? trim( (string) $item['url'] ) : '';

		if ( '' === $label ) {
			continue;
		}

		// Relative Pfade („/mein-beitrag/“) stammen aus der alten Tabelle und meinen den Blog.
		if ( '' !== $url && '/' === $url[0] && ( ! isset( $url[1] ) || '/' !== $url[1] ) ) {
			$url = 'https://blog.eduard-andrae.de' . $url;
		}

		$url = '' === $url ? '' : esc_url_raw( $url, array( 'http', 'https' ) );

		$links[] = array(
			'label' => $label,
			'url'   => $url,
		);
	}

	return $links;
}

/* -------------------------------------------------------------------------
 * Prüfregeln (Formular und REST-Ausgabe teilen sie)
 * ---------------------------------------------------------------------- */

/**
 * @param mixed $value z. B. „21,1“, „21.1“, „ 42,2 km “.
 * @return float|null Distanz mit einer Nachkommastelle, null wenn leer oder ungültig.
 */
function eddy_ls_parse_distance( $value ) {
	$text = str_replace( array( ',', 'km', ' ' ), array( '.', '', '' ), trim( (string) $value ) );

	if ( '' === $text || ! is_numeric( $text ) ) {
		return null;
	}

	$number = round( (float) $text, 1 );

	return ( $number > 0 && $number <= 1000 ) ? $number : null;
}

function eddy_ls_valid_date( $value ) {
	if ( ! is_string( $value ) || ! preg_match( '/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m ) ) {
		return false;
	}

	return checkdate( (int) $m[2], (int) $m[3], (int) $m[1] );
}

function eddy_ls_valid_time( $value ) {
	return is_string( $value ) && 1 === preg_match( '/^\d{1,2}:[0-5]\d:[0-5]\d$/', $value );
}

/* -------------------------------------------------------------------------
 * Eingabemaske
 * ---------------------------------------------------------------------- */

add_action( 'add_meta_boxes_' . EDDY_LS_POST_TYPE, 'eddy_ls_add_meta_box' );

function eddy_ls_add_meta_box() {
	add_meta_box( 'eddy_ls_fields', 'Daten des Laufs', 'eddy_ls_render_meta_box', EDDY_LS_POST_TYPE, 'normal', 'high' );
	// Zeigte dieselben Felder ein zweites Mal als rohe Schlüssel/Wert-Paare.
	remove_meta_box( 'postcustom', EDDY_LS_POST_TYPE, 'normal' );
}

add_filter( 'use_block_editor_for_post_type', 'eddy_ls_classic_editor', 10, 2 );

/**
 * Klassische Bearbeitungsseite statt Block-Editor: Ein Lauf hat keinen Fließtext, nur Felder.
 * Ohne diesen Filter öffnete WordPress den Block-Editor (wegen show_in_rest) und schöbe die
 * Eingabemaske in ein eingeklapptes Panel unter einer leeren Inhaltsfläche.
 */
function eddy_ls_classic_editor( $use, $post_type ) {
	return EDDY_LS_POST_TYPE === $post_type ? false : $use;
}

add_filter( 'enter_title_here', 'eddy_ls_title_placeholder', 10, 2 );

function eddy_ls_title_placeholder( $text, $post ) {
	return EDDY_LS_POST_TYPE === $post->post_type ? 'Veranstaltung, z. B. „AOK Halbmarathon Bremen“' : $text;
}

/**
 * @param WP_Post $post Der Lauf.
 */
function eddy_ls_render_meta_box( $post ) {
	wp_nonce_field( 'eddy_ls_save', EDDY_LS_NONCE );

	$choices  = eddy_ls_choices();
	$distance = get_post_meta( $post->ID, 'distanz_km', true );
	$values   = array(
		'datum'      => (string) get_post_meta( $post->ID, 'datum', true ),
		'distanz_km' => ( '' === $distance || 0.0 === (float) $distance ) ? '' : str_replace( '.', ',', number_format( (float) $distance, 1, '.', '' ) ),
		'zeit'       => (string) get_post_meta( $post->ID, 'zeit', true ),
		'art'        => (string) get_post_meta( $post->ID, 'art', true ),
		'ergebnis'   => (string) get_post_meta( $post->ID, 'ergebnis', true ),
		'wertung'    => (string) get_post_meta( $post->ID, 'wertung', true ),
		'notiz'      => eddy_ls_decode( get_post_meta( $post->ID, 'notiz', true ) ),
	);
	$links    = get_post_meta( $post->ID, 'links', true );
	$links    = is_array( $links ) ? $links : array();
	?>
	<style>
		.eddy-ls-grid { display: grid; grid-template-columns: 11rem 1fr; gap: .75rem 1rem; align-items: center; max-width: 46rem; }
		.eddy-ls-grid label { font-weight: 600; }
		.eddy-ls-grid .description { grid-column: 2; margin: -.5rem 0 0; }
		.eddy-ls-links { margin-top: 1.5rem; max-width: 46rem; }
		.eddy-ls-links td { padding: .25rem .5rem .25rem 0; }
	</style>
	<div class="eddy-ls-grid">
		<label for="eddy_ls_datum">Datum</label>
		<input type="date" id="eddy_ls_datum" name="eddy_ls[datum]" value="<?php echo esc_attr( $values['datum'] ); ?>" required>

		<label for="eddy_ls_art">Art</label>
		<?php eddy_ls_select( 'art', $choices['art'], $values['art'] ? $values['art'] : 'wettkampf' ); ?>

		<label for="eddy_ls_distanz_km">Distanz in km</label>
		<input type="text" inputmode="decimal" id="eddy_ls_distanz_km" name="eddy_ls[distanz_km]" value="<?php echo esc_attr( $values['distanz_km'] ); ?>" placeholder="21,1" style="width:8rem">
		<p class="description">Halbmarathon 21,1, Marathon 42,2. Leer lassen bei Meilensteinen.</p>

		<label for="eddy_ls_zeit">Zeit (netto)</label>
		<input type="text" id="eddy_ls_zeit" name="eddy_ls[zeit]" value="<?php echo esc_attr( $values['zeit'] ); ?>" placeholder="02:03:46" style="width:8rem">
		<p class="description">Stunden:Minuten:Sekunden. Leer bei DNS und Meilensteinen.</p>

		<label for="eddy_ls_ergebnis">Ergebnis</label>
		<?php eddy_ls_select( 'ergebnis', $choices['ergebnis'], $values['ergebnis'] ? $values['ergebnis'] : 'finish' ); ?>

		<label for="eddy_ls_wertung">Wertung</label>
		<?php eddy_ls_select( 'wertung', $choices['wertung'], $values['wertung'] ? $values['wertung'] : 'einzel' ); ?>
		<p class="description">Staffel und Triathlon zählen nicht als Marathon und nicht für Bestzeiten.</p>

		<label for="eddy_ls_notiz">Notiz</label>
		<input type="text" id="eddy_ls_notiz" name="eddy_ls[notiz]" value="<?php echo esc_attr( $values['notiz'] ); ?>" class="large-text">
	</div>

	<table class="eddy-ls-links">
		<thead><tr><th style="text-align:left">Link-Bezeichnung</th><th style="text-align:left">URL</th></tr></thead>
		<tbody>
		<?php for ( $i = 0; $i < max( EDDY_LS_LINK_ROWS, count( $links ) + 2 ); $i++ ) : ?>
			<?php $link = isset( $links[ $i ] ) && is_array( $links[ $i ] ) ? $links[ $i ] : array( 'label' => '', 'url' => '' ); ?>
			<tr>
				<td><input type="text" name="eddy_ls[links][<?php echo (int) $i; ?>][label]" value="<?php echo esc_attr( eddy_ls_decode( $link['label'] ) ); ?>" placeholder="<?php echo 0 === $i ? 'Urkunde' : ''; ?>"></td>
				<td><input type="url" name="eddy_ls[links][<?php echo (int) $i; ?>][url]" value="<?php echo esc_attr( $link['url'] ); ?>" class="large-text" placeholder="https://…"></td>
			</tr>
		<?php endfor; ?>
		</tbody>
	</table>
	<p class="description">Leere Zeilen werden beim Speichern verworfen. Eine Bezeichnung ohne URL bleibt als Text stehen.</p>
	<?php
}

function eddy_ls_select( $key, $options, $current ) {
	printf( '<select id="eddy_ls_%1$s" name="eddy_ls[%1$s]">', esc_attr( $key ) );
	foreach ( $options as $value => $label ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $label ) );
	}
	echo '</select>';
}

add_action( 'save_post_' . EDDY_LS_POST_TYPE, 'eddy_ls_save', 10, 2 );

/**
 * Speichert die Formularfelder. Läuft NUR für die Eingabemaske (Nonce); Schreibzugriffe über
 * die REST-API gehen über register_post_meta und dessen Schema.
 *
 * Ungültige Werte werden nicht gespeichert. Der bisherige Wert bleibt stehen, und ein Hinweis
 * nennt das Feld, statt dass ein Tippfehler die Zeit still löscht.
 *
 * @param int     $post_id Lauf.
 * @param WP_Post $post    Lauf.
 */
function eddy_ls_save( $post_id, $post ) {
	if ( ! isset( $_POST[ EDDY_LS_NONCE ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ EDDY_LS_NONCE ] ) ), 'eddy_ls_save' ) ) {
		return;
	}

	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$input   = isset( $_POST['eddy_ls'] ) && is_array( $_POST['eddy_ls'] ) ? wp_unslash( $_POST['eddy_ls'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- feldweise unten.
	$choices = eddy_ls_choices();
	$errors  = array();

	$datum = isset( $input['datum'] ) ? trim( (string) $input['datum'] ) : '';
	if ( eddy_ls_valid_date( $datum ) ) {
		update_post_meta( $post_id, 'datum', $datum );
	} else {
		$errors[] = 'Datum fehlt oder ist ungültig.';
	}

	$art = isset( $input['art'] ) && isset( $choices['art'][ $input['art'] ] ) ? $input['art'] : 'wettkampf';
	update_post_meta( $post_id, 'art', $art );

	foreach ( array( 'ergebnis', 'wertung' ) as $key ) {
		$value = isset( $input[ $key ] ) && isset( $choices[ $key ][ $input[ $key ] ] ) ? $input[ $key ] : array_key_first( $choices[ $key ] );
		update_post_meta( $post_id, $key, $value );
	}

	$raw_distance = isset( $input['distanz_km'] ) ? trim( (string) $input['distanz_km'] ) : '';
	$distance     = eddy_ls_parse_distance( $raw_distance );
	if ( '' === $raw_distance ) {
		delete_post_meta( $post_id, 'distanz_km' );
	} elseif ( null === $distance ) {
		$errors[] = sprintf( 'Distanz „%s“ ist keine gültige Zahl.', $raw_distance );
	} else {
		update_post_meta( $post_id, 'distanz_km', $distance );
	}

	$zeit = isset( $input['zeit'] ) ? trim( (string) $input['zeit'] ) : '';
	if ( '' === $zeit || eddy_ls_valid_time( $zeit ) ) {
		update_post_meta( $post_id, 'zeit', $zeit );
	} else {
		$errors[] = sprintf( 'Zeit „%s“ hat nicht das Format Stunden:Minuten:Sekunden.', $zeit );
	}

	update_post_meta( $post_id, 'notiz', isset( $input['notiz'] ) ? eddy_ls_sanitize_text( $input['notiz'] ) : '' );
	update_post_meta( $post_id, 'links', eddy_ls_sanitize_links( isset( $input['links'] ) ? $input['links'] : array() ) );

	if ( $errors ) {
		set_transient( 'eddy_ls_errors_' . get_current_user_id(), $errors, 60 );
	}
}

add_action( 'admin_notices', 'eddy_ls_admin_notices' );

function eddy_ls_admin_notices() {
	$key    = 'eddy_ls_errors_' . get_current_user_id();
	$errors = get_transient( $key );

	if ( ! is_array( $errors ) || ! $errors ) {
		return;
	}

	delete_transient( $key );
	echo '<div class="notice notice-error"><p><strong>Nicht alles wurde gespeichert:</strong></p><ul>';
	foreach ( $errors as $error ) {
		echo '<li>' . esc_html( $error ) . '</li>';
	}
	echo '</ul></div>';
}

/* -------------------------------------------------------------------------
 * Liste in WP-Admin
 * ---------------------------------------------------------------------- */

add_filter( 'manage_' . EDDY_LS_POST_TYPE . '_posts_columns', 'eddy_ls_columns' );

function eddy_ls_columns( $columns ) {
	return array(
		'cb'               => $columns['cb'],
		'eddy_ls_datum'    => 'Datum',
		'title'            => 'Veranstaltung',
		'eddy_ls_distanz'  => 'Distanz',
		'eddy_ls_zeit'     => 'Zeit',
		'eddy_ls_ergebnis' => 'Ergebnis',
	);
}

add_action( 'manage_' . EDDY_LS_POST_TYPE . '_posts_custom_column', 'eddy_ls_column_value', 10, 2 );

function eddy_ls_column_value( $column, $post_id ) {
	$choices = eddy_ls_choices();

	switch ( $column ) {
		case 'eddy_ls_datum':
			echo esc_html( (string) get_post_meta( $post_id, 'datum', true ) );
			break;
		case 'eddy_ls_distanz':
			$distance = (float) get_post_meta( $post_id, 'distanz_km', true );
			echo $distance > 0 ? esc_html( str_replace( '.', ',', number_format( $distance, 1, '.', '' ) ) . ' km' ) : '–';
			break;
		case 'eddy_ls_zeit':
			$zeit = (string) get_post_meta( $post_id, 'zeit', true );
			echo esc_html( '' === $zeit ? '–' : $zeit );
			break;
		case 'eddy_ls_ergebnis':
			$art = (string) get_post_meta( $post_id, 'art', true );
			if ( 'meilenstein' === $art ) {
				echo 'Meilenstein';
				break;
			}
			$ergebnis = (string) get_post_meta( $post_id, 'ergebnis', true );
			$wertung  = (string) get_post_meta( $post_id, 'wertung', true );
			$parts    = array( isset( $choices['ergebnis'][ $ergebnis ] ) ? $choices['ergebnis'][ $ergebnis ] : '' );
			if ( 'training' === $art ) {
				$parts[] = 'Training';
			}
			if ( $wertung && 'einzel' !== $wertung && isset( $choices['wertung'][ $wertung ] ) ) {
				$parts[] = $choices['wertung'][ $wertung ];
			}
			echo esc_html( implode( ' · ', array_filter( $parts ) ) );
			break;
	}
}

add_filter( 'manage_edit-' . EDDY_LS_POST_TYPE . '_sortable_columns', 'eddy_ls_sortable_columns' );

function eddy_ls_sortable_columns( $columns ) {
	$columns['eddy_ls_datum'] = 'eddy_ls_datum';

	return $columns;
}

add_action( 'pre_get_posts', 'eddy_ls_admin_order' );

/**
 * Sortiert die Admin-Liste nach dem Lauf-Datum, neueste zuerst, solange nichts anderes
 * gewählt ist. Ohne das stünde die Liste nach Anlagedatum, und nach dem Import wären alle
 * 68 Läufe vom selben Tag.
 *
 * @param WP_Query $query Die Abfrage.
 */
function eddy_ls_admin_order( $query ) {
	if ( ! is_admin() || ! $query->is_main_query() || EDDY_LS_POST_TYPE !== $query->get( 'post_type' ) ) {
		return;
	}

	$orderby = $query->get( 'orderby' );

	if ( '' === $orderby || 'eddy_ls_datum' === $orderby ) {
		$query->set( 'meta_key', 'datum' );
		$query->set( 'orderby', 'meta_value' );
		if ( '' === $query->get( 'order' ) || '' === $orderby ) {
			$query->set( 'order', isset( $_GET['order'] ) ? sanitize_key( wp_unslash( $_GET['order'] ) ) : 'desc' ); // phpcs:ignore WordPress.Security.NonceVerification -- reine Sortierung.
		}
	}
}

/* -------------------------------------------------------------------------
 * Öffentliche Leseschnittstelle
 * ---------------------------------------------------------------------- */

add_action( 'rest_api_init', 'eddy_ls_register_route' );

function eddy_ls_register_route() {
	register_rest_route(
		'eddy-laufstatistik/v1',
		'/laeufe',
		array(
			'methods'             => 'GET',
			'callback'            => 'eddy_ls_rest_list',
			'permission_callback' => '__return_true',
		)
	);
}

/**
 * Alle veröffentlichten Läufe in einer Antwort, neueste zuerst.
 *
 * Bewusst flach und mit festen Feldnamen statt wp/v2/laeufe: Die Nuxt-Seite braucht alle
 * Einträge auf einmal (wp/v2 liefert höchstens 100 pro Seite) und kein verschachteltes
 * meta-Objekt. Die Gegenstelle prüft trotzdem jeden Eintrag (shared/utils/lauf.ts).
 *
 * @return WP_REST_Response
 */
function eddy_ls_rest_list() {
	$posts = get_posts(
		array(
			'post_type'        => EDDY_LS_POST_TYPE,
			'post_status'      => 'publish',
			'posts_per_page'   => -1,
			'meta_key'         => 'datum', // phpcs:ignore WordPress.DB.SlowDBQuery -- ein paar hundert Einträge.
			'orderby'          => 'meta_value',
			'order'            => 'DESC',
			'suppress_filters' => true,
		)
	);

	$items = array();

	foreach ( $posts as $post ) {
		$distance = (float) get_post_meta( $post->ID, 'distanz_km', true );
		$links    = get_post_meta( $post->ID, 'links', true );

		$items[] = array(
			'id'         => (int) $post->ID,
			'titel'      => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'datum'      => (string) get_post_meta( $post->ID, 'datum', true ),
			'distanzKm'  => $distance > 0 ? $distance : null,
			'zeit'       => (string) get_post_meta( $post->ID, 'zeit', true ),
			'art'        => (string) get_post_meta( $post->ID, 'art', true ),
			'ergebnis'   => (string) get_post_meta( $post->ID, 'ergebnis', true ),
			'wertung'    => (string) get_post_meta( $post->ID, 'wertung', true ),
			'notiz'      => eddy_ls_decode( get_post_meta( $post->ID, 'notiz', true ) ),
			'links'      => is_array( $links ) ? array_map( 'eddy_ls_decode_link', array_values( $links ) ) : array(),
		);
	}

	return rest_ensure_response( $items );
}

function eddy_ls_decode_link( $link ) {
	return array(
		'label' => eddy_ls_decode( isset( $link['label'] ) ? $link['label'] : '' ),
		'url'   => isset( $link['url'] ) ? (string) $link['url'] : '',
	);
}

/* -------------------------------------------------------------------------
 * Neubau der Seite anstoßen
 * ---------------------------------------------------------------------- */

add_action( 'transition_post_status', 'eddy_ls_on_status_change', 10, 3 );

/**
 * Meldet jede Änderung an einem veröffentlichten Lauf über den Inhalts-Webhook
 * (Plugin eddy-comment-revalidate ab 1.2). Ohne das Plugin passiert nichts, dann greift
 * nur die ISR-Frist der Seite.
 *
 * transition_post_status feuert auch bei publish → publish, also bei jeder Bearbeitung.
 * Der Webhook fasst alle Meldungen eines Zeitfensters zu einem Aufruf zusammen.
 */
function eddy_ls_on_status_change( $new_status, $old_status, $post ) {
	if ( ! $post instanceof WP_Post || EDDY_LS_POST_TYPE !== $post->post_type ) {
		return;
	}

	if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
		return;
	}

	eddy_ls_request_rebuild();
}

add_action( 'deleted_post', 'eddy_ls_on_deleted', 10, 2 );

function eddy_ls_on_deleted( $post_id, $post ) {
	if ( $post instanceof WP_Post && EDDY_LS_POST_TYPE === $post->post_type && 'publish' === $post->post_status ) {
		eddy_ls_request_rebuild();
	}
}

add_action( 'updated_post_meta', 'eddy_ls_on_meta_change', 10, 2 );
add_action( 'added_post_meta', 'eddy_ls_on_meta_change', 10, 2 );

/**
 * Über die REST-API werden die Felder NACH dem Statuswechsel geschrieben. Ohne diesen
 * Haken würde bei einer reinen Feldänderung per API (Titel unverändert) nichts gemeldet.
 */
function eddy_ls_on_meta_change( $meta_id, $post_id ) {
	if ( EDDY_LS_POST_TYPE === get_post_type( $post_id ) && 'publish' === get_post_status( $post_id ) ) {
		eddy_ls_request_rebuild();
	}
}

function eddy_ls_request_rebuild() {
	if ( function_exists( 'eddy_cr_queue_statistik' ) ) {
		eddy_cr_queue_statistik();
	}
}
