import { useCallback, useEffect, useRef, type Ref } from "react"

interface FocusAnchorProps {
    title: string
    /** h3 in a page context (default), h4 where the hierarchy demands it. */
    as?: "h2" | "h3" | "h4"
    /**
     * Raising this value focuses the heading again. Deliberately separates
     * "move the focus" from "just render a heading". Leave it undefined to
     * focus exactly once on mount.
     */
    focusSeq?: number
    ref?: Ref<HTMLElement>
}

/**
 * A heading that takes focus, so a screen reader announces where it now is.
 *
 * The focus call runs in an effect, therefore AFTER the new title has
 * rendered. Calling focus() before the state that produces the title has
 * been committed makes the screen reader read the PREVIOUS title.
 */
export default function FocusAnchor({
    title,
    as: Tag = "h3",
    focusSeq,
    ref,
}: FocusAnchorProps) {
    const local = useRef<HTMLElement | null>(null)

    // A stable callback. An inline ref callback gets a new identity on every
    // render, which makes React call ref(null) and then ref(node) each time,
    // permanently nulling and resetting the parent's ref.
    const setRefs = useCallback(
        (node: HTMLHeadingElement | null) => {
            local.current = node

            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
        },
        [ref],
    )

    useEffect(() => {
        local.current?.focus()
    }, [focusSeq])

    return (
        <Tag tabIndex={-1} ref={setRefs}>
            {title}
        </Tag>
    )
}
