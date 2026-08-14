/**
 * The entire imperative Web Audio layer. No React import lives in here.
 */

let sharedContext: AudioContext | null = null

/**
 * One AudioContext for the whole site.
 *
 * Never create a context inside useMemo: useMemo is not a lifecycle hook,
 * has no cleanup slot, and its factory runs twice under StrictMode. Chrome
 * refuses to construct more than roughly six hardware contexts per process,
 * across every tab of the same origin, and the failure mode is silence —
 * the worst possible error message for a blind user.
 */
export function getAudioContext(): AudioContext {
    if (sharedContext === null || sharedContext.state === "closed") {
        sharedContext = new AudioContext({ latencyHint: "interactive" })
    }

    return sharedContext
}

/** Must be awaited from inside a real click handler, never from an effect. */
export async function unlockAudio(): Promise<AudioContext> {
    const ctx = getAudioContext()

    if (ctx.state !== "running") await ctx.resume()

    return ctx
}

export const GLIDE_TAU = 0.012

/**
 * Never assign to AudioParam.value while audio is playing. Per spec that is
 * identical to setValueAtTime(v, currentTime), so it steps at a render
 * quantum boundary. On a biquad the coefficients jump while the filter
 * state stays put, which is a discontinuity in the signal and therefore a
 * click — and in a listening game a click is an information leak: it marks
 * the exact moment of the switch and masks the first milliseconds of the
 * sound being judged.
 */
export function glide(
    param: AudioParam,
    target: number,
    ctx: BaseAudioContext,
    at: number = ctx.currentTime,
    tau: number = GLIDE_TAU,
): void {
    param.cancelScheduledValues(at)
    param.setValueAtTime(param.value, at)
    param.setTargetAtTime(target, at, tau)
}

/**
 * The setValueAtTime anchor is not optional: linearRampToValueAtTime
 * interpolates from the PREVIOUS automation event, so without an anchor a
 * ramp scheduled minutes later is effectively a jump.
 */
export function ramp(
    param: AudioParam,
    target: number,
    ctx: BaseAudioContext,
    seconds: number,
    at: number = ctx.currentTime,
): void {
    param.cancelScheduledValues(at)
    param.setValueAtTime(param.value, at)
    param.linearRampToValueAtTime(target, at + seconds)
}

export function dbToGain(db: number): number {
    return Math.pow(10, db / 20)
}

/**
 * Linear (equal gain) crossfade, deliberately not equal power. The usual DJ
 * default assumes uncorrelated material; here the variants are the same
 * piece of music through different processors and therefore strongly
 * correlated, so equal power would produce an audible +3 dB bump in the
 * middle of every switch — exactly the kind of cue the game must not give.
 *
 * EQ Detective does not use this; see EqDetective.buildAudio.
 */
export function crossfadeVariants(
    gains: readonly GainNode[],
    activeIndex: number,
    ctx: BaseAudioContext,
    at: number = ctx.currentTime,
    seconds = 0.018,
): void {
    gains.forEach((node, index) => {
        ramp(node.gain, index === activeIndex ? 1 : 0, ctx, seconds, at)
    })
}

export type EarconKind =
    | "tick"
    | "downbeat"
    | "ready"
    | "correct"
    | "wrong"
    | "timeUp"
    | "sessionEnd"

interface Blip {
    from: number
    to: number
    seconds: number
    peak: number
    offset: number
}

/**
 * Synthesised, no asset files. Deliberately no buzzer for "wrong" (it reads
 * as a system error rather than a game result) and no filtered noise
 * (indistinguishable from the training material).
 */
const EARCONS: Record<EarconKind, readonly Blip[]> = {
    tick: [{ from: 880, to: 880, seconds: 0.008, peak: 0.12, offset: 0 }],
    downbeat: [{ from: 1320, to: 1320, seconds: 0.012, peak: 0.18, offset: 0 }],
    ready: [
        { from: 700, to: 700, seconds: 0.06, peak: 0.18, offset: 0 },
        { from: 1050, to: 1050, seconds: 0.06, peak: 0.18, offset: 0.09 },
    ],
    correct: [{ from: 660, to: 990, seconds: 0.18, peak: 0.25, offset: 0 }],
    wrong: [{ from: 420, to: 300, seconds: 0.24, peak: 0.22, offset: 0 }],
    timeUp: [
        { from: 500, to: 500, seconds: 0.08, peak: 0.22, offset: 0 },
        { from: 500, to: 500, seconds: 0.08, peak: 0.22, offset: 0.12 },
        { from: 500, to: 500, seconds: 0.08, peak: 0.22, offset: 0.24 },
    ],
    sessionEnd: [{ from: 880, to: 440, seconds: 0.4, peak: 0.22, offset: 0 }],
}

/**
 * Returns the oscillators it scheduled, so a caller can silence sounds that
 * are queued but have not played yet.
 */
export function playEarcon(
    ctx: AudioContext,
    out: AudioNode,
    kind: EarconKind,
    at: number = ctx.currentTime + 0.01,
): OscillatorNode[] {
    const started: OscillatorNode[] = []

    for (const blip of EARCONS[kind]) {
        const start = at + blip.offset
        const osc = new OscillatorNode(ctx, {
            type: "sine",
            frequency: blip.from,
        })
        const env = new GainNode(ctx, { gain: 0 })

        if (blip.to !== blip.from) {
            osc.frequency.setValueAtTime(blip.from, start)
            osc.frequency.linearRampToValueAtTime(blip.to, start + blip.seconds)
        }

        const attack = Math.min(0.006, blip.seconds * 0.4)

        env.gain.setValueAtTime(0, start)
        env.gain.linearRampToValueAtTime(blip.peak, start + attack)
        env.gain.setTargetAtTime(0, start + blip.seconds * 0.6, 0.04)

        osc.connect(env).connect(out)
        osc.start(start)
        osc.stop(start + blip.seconds + 0.3)

        osc.onended = () => {
            osc.disconnect()
            env.disconnect()
        }

        started.push(osc)
    }

    return started
}

/**
 * Audible count-in. Producers count clicks faster and more reliably than a
 * screen reader can interrupt itself five times, and a focused heading whose
 * text changes is not re-announced anyway.
 */
export function scheduleCountIn(
    ctx: AudioContext,
    out: AudioNode,
    startAt: number,
    seconds: number,
): OscillatorNode[] {
    const started: OscillatorNode[] = []

    for (let i = 0; i < seconds; i++) {
        started.push(...playEarcon(ctx, out, "tick", startAt + i))
    }

    started.push(...playEarcon(ctx, out, "downbeat", startAt + seconds))

    return started
}

export interface SpectrumProbe {
    node: AnalyserNode
    sample(): void
    averagePower(): Float64Array
    binFrequencies(): Float32Array
    /** Total samples taken since the probe was created. */
    frames(): number
    /**
     * Samples taken since the source material last changed. This, not
     * frames(), is what tells you whether the running average actually
     * describes what is playing right now.
     */
    sourceFrames(): number
    /** Called when a new track starts, so sourceFrames() restarts at zero. */
    markSourceChange(): void
    reset(): void
}

/**
 * Per sample() call, at one call every 100 ms. Gives the running average a
 * half life of roughly 3.4 seconds, so it follows the piece of music that is
 * playing right now.
 *
 * A plain lifetime average would blend every track heard since the page was
 * opened: after switching from a dense mix to a sparse one, the average
 * would still describe the dense one, the compensation would be computed
 * for the wrong spectrum, and the processed variant would end up audibly
 * louder than the original — handing the player the answer by loudness.
 * An exponential average fixes that without a reset, which matters because
 * a reset would leave the probe empty exactly in the time attack rounds that
 * have no count-in to refill it.
 */
const PROBE_DECAY = 0.98

/**
 * Roughly one second of data. Below this the running average is not yet
 * trustworthy and a compensation computed from it must not be cached.
 */
export const PROBE_MIN_FRAMES = 10

/**
 * Measures the recent spectrum of the unprocessed source, which is what the
 * loudness compensation weights the filter response against.
 *
 * The analyser must sit inline in the path to the destination — it is a
 * pass through node, and the rendering engine is pull based, so an analyser
 * whose output goes nowhere is never pulled and only ever returns zeros.
 */
export function createProbe(ctx: AudioContext): SpectrumProbe {
    const node = new AnalyserNode(ctx, {
        fftSize: 4096,
        smoothingTimeConstant: 0,
        minDecibels: -140,
    })

    const bins = node.frequencyBinCount
    const scratch = new Float32Array(bins)
    const accumulated = new Float64Array(bins)
    const frequencies = new Float32Array(bins)

    for (let i = 0; i < bins; i++) {
        frequencies[i] = ((i + 0.5) * ctx.sampleRate) / (2 * bins)
    }

    const DECAY = PROBE_DECAY

    let weight = 0
    let frames = 0
    let sourceFrames = 0

    return {
        node,
        sample() {
            node.getFloatFrequencyData(scratch)

            let usable = false

            for (let i = 0; i < bins; i++) {
                const db = scratch[i]

                // getFloatFrequencyData is NOT clamped to minDecibels and
                // returns -Infinity for silent bins. Without this guard the
                // average becomes NaN and the compensation silently breaks.
                if (!Number.isFinite(db)) continue

                accumulated[i] = accumulated[i] * DECAY + Math.pow(10, db / 10)
                usable = true
            }

            if (usable) {
                weight = weight * DECAY + 1
                frames += 1
                sourceFrames += 1
            }
        },
        averagePower() {
            const out = new Float64Array(bins)

            if (weight <= 0) return out

            for (let i = 0; i < bins; i++) out[i] = accumulated[i] / weight

            return out
        },
        binFrequencies: () => frequencies,
        frames: () => frames,
        sourceFrames: () => sourceFrames,
        markSourceChange() {
            // The accumulator is deliberately kept: it decays into the new
            // track on its own, and a hard reset would leave the probe empty
            // in exactly the time attack rounds that have no count-in to
            // refill it. Only the counter restarts, so callers can tell how
            // much of the average still describes the previous track.
            sourceFrames = 0
        },
        reset() {
            accumulated.fill(0)
            weight = 0
            frames = 0
            sourceFrames = 0
        },
    }
}

/**
 * How much broadband level a filter adds, given the measured source
 * spectrum: -10 * log10( SUM P|H|^2 / SUM P ). Exact for linear filters, so
 * no OfflineAudioContext and no decodeAudioData are needed — decoding the
 * seven Opus tracks would run well past 100 MB of memory.
 *
 * The filter passed in must be a throwaway instance carrying the TARGET
 * gain; the live filter sits at 0 dB while the measurement happens.
 */
export function responseCompensationDb(
    probe: SpectrumProbe,
    filter: BiquadFilterNode,
): number {
    if (probe.frames() === 0) return 0

    // Copied rather than passed through: getFrequencyResponse wants an
    // array backed by a plain ArrayBuffer, and it writes into its outputs.
    const frequencies = new Float32Array(probe.binFrequencies())
    const magnitude = new Float32Array(frequencies.length)
    const phase = new Float32Array(frequencies.length)

    filter.getFrequencyResponse(frequencies, magnitude, phase)

    const power = probe.averagePower()

    let weighted = 0
    let total = 0

    for (let i = 0; i < frequencies.length; i++) {
        const p = power[i]
        const m = magnitude[i]

        if (!Number.isFinite(p) || !Number.isFinite(m) || p <= 0) continue

        total += p
        weighted += p * m * m
    }

    if (total <= 0 || weighted <= 0) return 0

    return -10 * Math.log10(weighted / total)
}

export interface AudioRig {
    ctx: AudioContext
    /**
     * Where a game taps the signal. This is the probe output, so the probe
     * always sits inline in the pull path and measures the unprocessed
     * source — which is precisely the spectrum the compensation needs.
     */
    source: AudioNode
    /** Where a game hands its processed signal back. */
    sink: AudioNode
    /** Earcon bus. Bypasses the game chain and the ducker. */
    cues: AudioNode
    probe: SpectrumProbe
    now(): number
    loadTrack(url: string, offsetFraction: number): Promise<void>
    /** Resumes the already loaded track without reloading or reseeking. */
    ensurePlaying(): Promise<void>
    /** Fades out and pauses. Used when a session ends. */
    stopTrack(): void
    setVolumeDb(db: number): void
    setRoundTrimDb(db: number): void
    duck(on: boolean): void
    earcon(kind: EarconKind, at?: number): void
    scheduleCountIn(seconds: number): void
    /**
     * Silences cues that are queued but have not sounded yet. The cue bus
     * deliberately bypasses the trim and the ducker, so nothing else can
     * stop a count-in that is already scheduled.
     */
    cancelCues(): void
    dispose(): void
}

const LOAD_TIMEOUT_MS = 10000
const DEFAULT_VOLUME_DB = -6

export function createRig(ctx: AudioContext): AudioRig {
    // Created imperatively rather than rendered as JSX:
    // createMediaElementSource may run only ONCE per element (a second call
    // throws InvalidStateError) and the rerouting is permanent, so React
    // must never be able to unmount the element out from under the node.
    // A fresh rig gets a fresh element, which makes that rule trivially
    // true and makes StrictMode's create/dispose/create harmless.
    const element = new Audio()

    element.loop = true
    element.preload = "auto"
    // element.crossOrigin stays unset: the tracks are same origin via Vite.
    // If they ever move to a CDN this MUST become "anonymous" with matching
    // CORS headers, otherwise the spec requires the source node to output
    // silence — every game would go quiet with no error at all.

    const media = ctx.createMediaElementSource(element)
    const probe = createProbe(ctx)
    const trim = new GainNode(ctx, { gain: 1 })
    const duckGain = new GainNode(ctx, { gain: 1 })
    const master = new GainNode(ctx, { gain: dbToGain(DEFAULT_VOLUME_DB) })
    const cues = new GainNode(ctx, { gain: 1 })

    // element -> media -> probe -> [game chain] -> trim -> duck -> master
    // cues -----------------------------------------------------^
    //
    // The volume control sits AFTER the game chain, unlike the previous
    // implementation, where it sat before the boost and could do nothing
    // about clipping. Earcons bypass both the game chain and the ducker.
    media.connect(probe.node)
    trim.connect(duckGain).connect(master).connect(ctx.destination)
    cues.connect(master)

    // Guards the deferred pause in stopTrack() against a session that has
    // been restarted in the meantime.
    let playToken = 0

    // Cues scheduled ahead of time and not yet finished.
    let pendingCues: OscillatorNode[] = []

    function waitForMetadata(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let done = false

            const finish = (error?: Error) => {
                if (done) return
                done = true
                window.clearTimeout(timer)
                element.removeEventListener("loadedmetadata", onLoaded)
                element.removeEventListener("error", onError)
                if (error) reject(error)
                else resolve()
            }

            const onLoaded = () => finish()
            const onError = () => finish(new Error("The track failed to load."))

            const timer = window.setTimeout(
                () => finish(new Error("The track took too long to load.")),
                LOAD_TIMEOUT_MS,
            )

            element.addEventListener("loadedmetadata", onLoaded)
            element.addEventListener("error", onError)
        })
    }

    function cancelCues(): void {
        const now = ctx.currentTime

        for (const osc of pendingCues) {
            try {
                // A stop time before the start time means the node never
                // sounds at all, which is exactly what is wanted for cues
                // that are still queued.
                osc.stop(now)
            } catch {
                // Already finished; onended has disconnected it.
            }
        }

        pendingCues = []
    }

    return {
        ctx,
        source: probe.node,
        sink: trim,
        cues,
        probe,
        now: () => ctx.currentTime,

        async loadTrack(url: string, offsetFraction: number) {
            playToken += 1

            // The running spectrum average now describes the outgoing track,
            // so anything computed from it is stale until it has decayed
            // into the new one.
            probe.markSourceChange()

            // Strictly serialised. Changing src on a playing element aborts
            // the pending play() promise, and with autoplay there is no
            // promise left to attach a catch to.
            element.pause()
            element.src = url
            element.load()

            await waitForMetadata()

            if (Number.isFinite(element.duration)) {
                element.currentTime = element.duration * offsetFraction
            }

            await element.play()
        },

        async ensurePlaying() {
            playToken += 1

            if (element.paused && element.src !== "") await element.play()
        },

        stopTrack() {
            const token = ++playToken

            // Faded rather than cut, so the end of a session is not a click.
            // trim is restored by setRoundTrimDb at the start of every round.
            ramp(trim.gain, 0, ctx, 0.3)

            window.setTimeout(() => {
                if (token === playToken) element.pause()
            }, 400)
        },

        setVolumeDb(db: number) {
            const safe = Number.isFinite(db) ? db : DEFAULT_VOLUME_DB

            glide(master.gain, safe <= -60 ? 0 : dbToGain(safe), ctx)
        },

        setRoundTrimDb(db: number) {
            glide(trim.gain, dbToGain(Number.isFinite(db) ? db : 0), ctx)
        },

        duck(on: boolean) {
            ramp(duckGain.gain, on ? dbToGain(-12) : 1, ctx, 0.08)
        },

        earcon(kind: EarconKind, at?: number) {
            playEarcon(ctx, cues, kind, at)
        },

        scheduleCountIn(seconds: number) {
            pendingCues.push(
                ...scheduleCountIn(ctx, cues, ctx.currentTime + 0.05, seconds),
            )
        },

        cancelCues,

        dispose() {
            cancelCues()
            element.pause()
            element.removeAttribute("src")
            element.load()

            media.disconnect()
            probe.node.disconnect()
            trim.disconnect()
            duckGain.disconnect()
            master.disconnect()
            cues.disconnect()
            // The context itself is never closed.
        },
    }
}
