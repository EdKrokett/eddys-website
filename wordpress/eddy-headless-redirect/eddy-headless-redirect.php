<?php
/**
 * Plugin Name: Headless-Weiterleitung für eduard-andrae.de
 * Description: Leitet Leser des WordPress-Frontends per 301 auf die gleiche Seite unter eduard-andrae.de um. WordPress bleibt Redaktionssystem, REST-API und Bildquelle. Mit Testmodus, der nur einen Header setzt.
 * Version:     1.2.0
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
