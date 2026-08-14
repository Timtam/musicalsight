import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"

export type Politeness = "polite" | "assertive"

export interface AnnouncerApi {
    say(text: string, politeness?: Politeness): void
    /** Re-announces the last message, even though its text is unchanged. */
    repeat(): void
    last(): string
}

const FALLBACK: AnnouncerApi = {
    say: () => undefined,
    repeat: () => undefined,
    last: () => "",
}

export const AnnouncerContext = createContext<AnnouncerApi>(FALLBACK)

export function useAnnouncer(): AnnouncerApi {
    return useContext(AnnouncerContext)
}

interface Channel {
    text: string
    seq: number
}

const EMPTY: Channel = { text: "", seq: 0 }

/** What <LiveRegions> needs from the provider. Not part of the public API. */
interface RegionsState {
    polite: Channel
    assertive: Channel
    /** Re-arms the startup buffer when the regions move in the DOM. */
    arm(): void
}

const RegionsContext = createContext<RegionsState>({
    polite: EMPTY,
    assertive: EMPTY,
    arm: () => undefined,
})

/**
 * How long a message stays in the DOM before it is wiped.
 *
 * Once the accessibility API has picked up the mutation the announcement is
 * queued and speaks to the end on its own, so clearing the node does not cut
 * it off. Leaving the text in place, on the other hand, parks it permanently
 * at a fixed spot in the document, where the virtual cursor reads it again on
 * every pass and a braille display shows it indefinitely.
 */
const CLEAR_AFTER_MS = 1000

/** Grace period before the first write after the regions are mounted. */
const READY_DELAY_MS = 150

/**
 * Holds the announcement state for the whole app. The regions themselves are
 * rendered by <LiveRegions>, which the game places inside its dialog.
 *
 * A region container must sit in the DOM, empty, before the first message
 * arrives: inserting a container together with its content makes most screen
 * readers swallow that first message. Since the regions now move with the
 * dialog, that grace period is re-armed on every mount and messages sent
 * during it are buffered rather than lost.
 *
 * Their text is wiped a second after each announcement. A live region is a
 * loudspeaker, not a log: the durable copy of anything worth re-reading
 * belongs in ordinary page content, which is why the game repeats every
 * verdict under its "Last round" heading.
 *
 * There are exactly two regions rather than one per statistic. JAWS with
 * Chrome treats every region as polite and queues them, and VoiceOver lets
 * assertive regions overwrite one another — so score, lives, streak and
 * time are folded into the one feedback announcement that happens anyway.
 *
 * No self voicing via the Web Speech API: blind users prefer their own
 * screen reader with their own voice and rate, and two voices talking at
 * once are unusable.
 */
export default function Announcer({ children }: { children: ReactNode }) {
    const [polite, setPolite] = useState<Channel>(EMPTY)
    const [assertive, setAssertive] = useState<Channel>(EMPTY)

    const ready = useRef(false)
    const pending = useRef<{ text: string; politeness: Politeness }[]>([])
    const lastMessage = useRef<{ text: string; politeness: Politeness }>({
        text: "",
        politeness: "polite",
    })

    const clearTimers = useRef<Record<Politeness, number | undefined>>({
        polite: undefined,
        assertive: undefined,
    })

    const emit = useCallback((text: string, politeness: Politeness) => {
        lastMessage.current = { text, politeness }

        const setChannel = politeness === "assertive" ? setAssertive : setPolite

        setChannel((channel) => ({ text, seq: channel.seq + 1 }))

        // A pending wipe from the previous message must not erase this one.
        window.clearTimeout(clearTimers.current[politeness])

        clearTimers.current[politeness] = window.setTimeout(() => {
            // The seq is deliberately left alone: only the text goes. Bumping
            // it would replace the node and could read as a fresh, empty
            // announcement.
            setChannel((channel) => ({ ...channel, text: "" }))
        }, CLEAR_AFTER_MS)
    }, [])

    useEffect(() => {
        const timers = clearTimers.current

        return () => {
            window.clearTimeout(timers.polite)
            window.clearTimeout(timers.assertive)
        }
    }, [])

    const [armSeq, setArmSeq] = useState(0)
    const arm = useCallback(() => setArmSeq((n) => n + 1), [])

    // The accessibility API needs a moment to register the regions before the
    // first write, otherwise it is not observed at all. This re-arms whenever
    // the regions are mounted somewhere new — moving them into the game
    // dialog is, as far as the accessibility tree is concerned, the same as
    // creating them for the first time.
    useEffect(() => {
        ready.current = false

        const timer = window.setTimeout(() => {
            ready.current = true

            const queued = pending.current
            pending.current = []

            for (const message of queued) emit(message.text, message.politeness)
        }, READY_DELAY_MS)

        return () => window.clearTimeout(timer)
    }, [emit, armSeq])

    const regions = useMemo<RegionsState>(
        () => ({ polite, assertive, arm }),
        [polite, assertive, arm],
    )

    const api = useMemo<AnnouncerApi>(
        () => ({
            say(text: string, politeness: Politeness = "polite") {
                if (!text) return

                if (!ready.current) {
                    pending.current.push({ text, politeness })
                    return
                }

                emit(text, politeness)
            },
            repeat() {
                const { text, politeness } = lastMessage.current

                if (text) emit(text, politeness)
            },
            last: () => lastMessage.current.text,
        }),
        [emit],
    )

    return (
        <AnnouncerContext.Provider value={api}>
            <RegionsContext.Provider value={regions}>
                {children}
            </RegionsContext.Provider>
        </AnnouncerContext.Provider>
    )
}

/**
 * The two live regions themselves, rendered wherever announcements have to
 * arrive.
 *
 * They must sit INSIDE the game dialog while it is open. react-bootstrap
 * puts `aria-modal="true"` on the dialog, which tells assistive technology
 * to treat everything outside it as inert — a live region out there is not
 * reliably observed, and the game would go silent exactly when it matters.
 *
 * Render at most one of these at a time; two would announce everything
 * twice.
 */
export function LiveRegions() {
    const { polite, assertive, arm } = useContext(RegionsContext)

    useEffect(() => {
        arm()
    }, [arm])

    return (
        <>
            {/*
                The changing React key replaces the text node and therefore
                forces a re-announcement even when the text is identical.
                Without it, two wrong answers in a row produce the same
                sentence and the second one is silent, which reads to the
                user as a broken game.

                Bootstrap's .visually-hidden uses clip and absolute
                positioning, never display:none — a hidden region announces
                nothing in every screen reader combination.
            */}
            <div
                className="visually-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <span key={polite.seq}>{polite.text}</span>
            </div>
            <div
                className="visually-hidden"
                aria-live="assertive"
                aria-atomic="true"
            >
                <span key={assertive.seq}>{assertive.text}</span>
            </div>
        </>
    )
}
