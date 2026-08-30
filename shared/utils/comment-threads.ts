import type { WordPressComment, WordPressCommentNode } from '../types/wordpress'

/**
 * Baut aus der flachen WP-Kommentarliste den Antwortbaum.
 *
 * 27 von 50 Kommentaren sind Antworten (Messung 30.08.2026) — Eddy antwortet seinen
 * Lesern regelmäßig. Eine flache Liste würde diesen Dialog unlesbar machen.
 *
 * PRE:  `comments` ist chronologisch sortiert (WP `order=asc`); `parent` ist 0 oder
 *       die id eines anderen Kommentars
 * POST: jeder Eingabe-Kommentar taucht GENAU EINMAL im Baum auf; Wurzeln und
 *       Antworten behalten je die Eingabereihenfolge
 * INV:  Waisen (parent zeigt ins Leere) werden zu Wurzeln, nie verworfen — sonst
 *       verschwänden Kommentare stillschweigend, wenn WP-Pagination einen Thread
 *       zerschneidet oder der Elternkommentar gelöscht wurde
 * INV:  das Ergebnis ist immer zyklenfrei, auch bei widersprüchlichen parent-Verweisen
 *       — ein Zyklus würde die rekursive Kommentar-Komponente endlos rendern lassen
 */
export function buildCommentThreads(comments: WordPressComment[]): WordPressCommentNode[] {
  const nodes = new Map<number, WordPressCommentNode>()
  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] })
  }

  const roots: WordPressCommentNode[] = []

  for (const comment of comments) {
    const node = nodes.get(comment.id)!
    const parent = comment.parent ? nodes.get(comment.parent) : undefined

    // Hängt der angebliche Elternteil bereits UNTER diesem Knoten, würde das
    // Einhängen den Baum zum Ring schliessen. Deckt auch parent === id ab, weil
    // der Teilbaum den Knoten selbst enthält.
    if (!parent || containsInSubtree(node, parent)) {
      roots.push(node)
      continue
    }

    parent.replies.push(node)
  }

  return roots
}

/** Steckt `target` irgendwo im Teilbaum unter (oder auf) `root`? */
function containsInSubtree(root: WordPressCommentNode, target: WordPressCommentNode): boolean {
  if (root === target) return true
  return root.replies.some(child => containsInSubtree(child, target))
}
