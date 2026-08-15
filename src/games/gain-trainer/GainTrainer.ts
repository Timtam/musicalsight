import { dbToGain, glide, ramp, type AudioRig } from "../engine/audio"
import { loudPassages } from "../engine/profile"
import type {
    Answer,
    GameAudio,
    GameSpec,
    LevelSpec,
    MakeRoundContext,
    Round,
} from "../engine/types"

export type GainMode = "louder" | "quieter" | "mixed"

export interface GainSettings {
    mode: GainMode
}

/** One difficulty level. Add, remove or reorder these freely. */
export interface GainLevel extends LevelSpec {
    /**
     * The gap between neighbouring answers, in decibels. THIS is the
     * difficulty of this game — see the note above `levels`.
     */
    stepDb: number
    /** Largest cut that can be the correct answer, as a positive number. */
    deepestCutDb: number
    /** Largest boost that can be the correct answer. */
    highestBoostDb: number
    pointsPerCorrectAnswer: number
}

export interface GainModeOption {
    id: GainMode
    label: string
}

export interface GainConfig {
    countInSeconds: number
    lives: number
    timeAttackSeconds: number
    roundLevelJitterDb: number
    trackHoldRounds: number
    trackStartEarliestFraction: number
    trackStartLatestFraction: number
    quietPassageThresholdDb: number
    streakBonusPoints: number
    streakBonusCap: number
    defaultSettings: GainSettings
    modes: GainModeOption[]
    levels: GainLevel[]
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  GAIN TRAINER — ALL SETTINGS IN ONE PLACE
 *
 *  Everything you can tune about this game lives in this one object. You do
 *  not need to read or change any of the code below it.
 *
 *  To add a difficulty level, copy one of the blocks in `levels`, paste it,
 *  and give it a new `id`. The settings page picks it up on its own.
 *
 *  One thing is worked out automatically and is deliberately NOT set here:
 *  the headroom. A broadband boost has nowhere to go — the destination clamps
 *  at full scale and mastered music already sits there — so the whole chain
 *  is attenuated by the largest boost any level offers, and every round plays
 *  underneath that ceiling. See HEADROOM_DB.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const GAIN_CONFIG: GainConfig = {
    /** Seconds of untouched music before the level change is revealed. */
    countInSeconds: 4,

    /** Wrong answers allowed in practice mode before the session ends. */
    lives: 3,

    /** Length of a time attack session, in seconds. */
    timeAttackSeconds: 60,

    /**
     * A small random volume change applied once per round, in decibels.
     *
     * Unlike in EQ Detective this is not a defence against anything: it is
     * drawn once per round and both variants pass through it, so it shifts
     * the pair together and the DIFFERENCE — the entire question — comes out
     * untouched. It stays because it stops a player carrying an absolute
     * memory of "how loud the original is" from one round into the next,
     * which would otherwise turn a comparison into a recall test.
     */
    roundLevelJitterDb: 1.5,

    /** How many rounds in a row use the same piece of music. */
    trackHoldRounds: 4,

    /** Where in the track playback starts, as a fraction of its length. */
    trackStartEarliestFraction: 0.05,
    trackStartLatestFraction: 0.65,

    /**
     * Passages quieter than this relative to the rest of the track are
     * skipped entirely.
     *
     * This matters more here than it does for a filter. A 3 dB change during
     * a fade or in the gap between two phrases is not subtle, it is simply
     * not there, and the round becomes a coin toss for a reason the player
     * has no way to hear.
     */
    quietPassageThresholdDb: -15,

    /** Extra points per answer in a run of correct answers. */
    streakBonusPoints: 25,
    /** The streak length past which the bonus stops growing. */
    streakBonusCap: 4,

    /** What the settings page starts out with. */
    defaultSettings: { mode: "mixed" },

    modes: [
        { id: "mixed", label: "Louder or quieter, at random" },
        { id: "quieter", label: "Quieter only" },
        { id: "louder", label: "Louder only" },
    ],

    /**
     * Difficulty here is `stepDb`, NOT the number of options — which is the
     * opposite of EQ Detective, and worth being explicit about.
     *
     * Naming a frequency gets harder as the list grows, because the bands
     * crowd together while each one stays perfectly audible. Naming a level
     * change does not work that way: the ear's resolution for loudness is
     * roughly a constant number of decibels wherever you are on the scale, so
     * what makes a round hard is how close the neighbouring answers sit. At
     * 0.5 dB the game is asking for something near the limit of what is
     * audible on music at all.
     *
     * The ranges therefore shrink as the steps do, purely to keep the list
     * walkable — a 0.5 dB grid over the beginner range would be 49 options.
     *
     * Cuts reach further than boosts on every level, and that is not
     * decoration: see HEADROOM_DB. Deep cuts cost nothing, boosts cost
     * headroom for the entire game.
     */
    levels: [
        {
            id: 1,
            label: "Beginner",
            description: "3 decibel steps, the widest",
            stepDb: 3,
            deepestCutDb: 18,
            highestBoostDb: 6,
            pointsPerCorrectAnswer: 100,
            supportsTimeAttack: true,
        },
        {
            id: 2,
            label: "Intermediate",
            description: "2 decibel steps",
            stepDb: 2,
            deepestCutDb: 16,
            highestBoostDb: 6,
            pointsPerCorrectAnswer: 150,
            supportsTimeAttack: true,
        },
        {
            id: 3,
            label: "Advanced",
            description: "1 decibel steps",
            stepDb: 1,
            deepestCutDb: 12,
            highestBoostDb: 6,
            pointsPerCorrectAnswer: 200,
            supportsTimeAttack: true,
        },
        {
            id: 4,
            label: "Expert",
            description: "half decibel steps, close to the limit of hearing",
            stepDb: 0.5,
            deepestCutDb: 6,
            highestBoostDb: 3,
            pointsPerCorrectAnswer: 250,
            supportsTimeAttack: true,
        },
    ],
}

// ═══════════════════════════════════════════════════════════════════════════
//  Below here is the game itself.
// ═══════════════════════════════════════════════════════════════════════════

/** Fade length when a round's audio chain is swapped in or out. */
const TEARDOWN_SECONDS = 0.03

/** How long the outgoing chain stays connected so its fade can finish. */
const TEARDOWN_MS = 80

/**
 * How far the whole game sits below the level everything else plays at.
 *
 * A peaking filter boosts one band, and the rest of the spectrum leaves room
 * for it. A gain stage boosts everything at once, and mastered music has no
 * room at all: AudioDestinationNode clamps to full scale, so a +6 dB round on
 * a loud passage would not be "louder", it would be distorted — and distortion
 * is a giveaway that identifies the boosted variant without hearing its level.
 *
 * So the entire chain is dropped by the largest boost any level can ask for,
 * and every round plays below that ceiling. Derived, never hand-set: add a
 * level with a bigger boost and the headroom follows on its own.
 *
 * The round jitter is in the budget too, and that is not fussiness. It is
 * applied by the rig's trim, which sits AFTER the game chain — so covering
 * only the boost leaves the loudest possible round at +1.5 dB over full
 * scale, on exactly the material where it is most likely to matter: the
 * quietest track gets no loudness attenuation at all, being the reference the
 * others are pulled down to.
 */
const HEADROOM_DB =
    Math.max(0, ...GAIN_CONFIG.levels.map((level) => level.highestBoostDb)) +
    Math.abs(GAIN_CONFIG.roundLevelJitterDb)

export interface GainParams {
    /** Signed: negative is quieter. The whole answer, in one number. */
    deltaDb: number
    points: number
}

function levelById(id: number): GainLevel {
    return (
        GAIN_CONFIG.levels.find((level) => level.id === id) ??
        GAIN_CONFIG.levels[0]
    )
}

/**
 * Every answer this level offers, quietest first, always including 0.
 *
 * Zero earns its place: without it the question is only ever "how much", and
 * a player who hears nothing still has to name a number. With it, "no change"
 * is sayable, and every round demands an actual decision about whether
 * anything happened at all.
 */
export function buildLadder(level: GainLevel): number[] {
    const values: number[] = []

    for (let db = -level.deepestCutDb; db <= level.highestBoostDb; ) {
        // Rebuilt from an integer count rather than accumulated, so a 0.5
        // step cannot drift into 2.9999999999999996 and print as "-3".
        values.push(db)
        db = Math.round((db + level.stepDb) * 100) / 100
    }

    if (!values.includes(0)) values.push(0)

    return values.sort((a, b) => a - b)
}

/** "n60" for -6.0 dB. Stable across rounds, and never a bare minus sign. */
export function optionId(db: number): string {
    return `${db < 0 ? "n" : "p"}${Math.round(Math.abs(db) * 10)}`
}

/** Visible: "-6 dB", "+3.5 dB", "0 dB". */
export function formatDb(db: number): string {
    if (db === 0) return "0 dB"

    const magnitude = Number.isInteger(db) ? String(db) : db.toFixed(1)

    return db > 0 ? `+${magnitude} dB` : `${magnitude} dB`
}

/**
 * Spoken. "minus six dB" invites a screen reader to read the sign as
 * punctuation or drop it; the direction is the more important half of the
 * answer, so it is said in words.
 */
export function speakDb(db: number): string {
    // Lower case, because every use of this is mid-sentence except the option
    // labels, and there it is an aria-label — where case changes nothing that
    // is spoken, while "You chose No change" would be visibly wrong under
    // "Last round".
    if (db === 0) return "no change"

    const magnitude = Number.isInteger(db) ? String(db) : db.toFixed(1)
    const unit = Math.abs(db) === 1 ? "decibel" : "decibels"

    return `${magnitude.replace("-", "")} ${unit} ${db > 0 ? "louder" : "quieter"}`
}

/** "3 decibels too much" — how wrong a wrong answer was, in the same unit. */
export function describeGap(chosen: number, correct: number): string {
    const gap = Math.round(Math.abs(chosen - correct) * 10) / 10
    const unit = gap === 1 ? "decibel" : "decibels"

    // The two zero cases are not "too much" or "too little" — one is hearing
    // something that was not there and the other is missing it entirely, and
    // both are worth naming as what they are.
    if (correct === 0) return `${gap} ${unit} out`

    if (chosen === 0) return `you missed all ${gap} ${unit} of it`

    // Overshooting a cut and undershooting a boost are both "too far" only if
    // you think in signed numbers. The player thinks in loudness, so it is
    // said the way they heard it.
    if (Math.sign(chosen) !== Math.sign(correct))
        return `you had the direction backwards, ${gap} ${unit} out`

    return `${gap} ${unit} too ${Math.abs(chosen) > Math.abs(correct) ? "much" : "little"}`
}

function makeRound(context: MakeRoundContext<GainSettings>): Round<GainParams> {
    const level = levelById(context.level)
    const ladder = buildLadder(level)

    const others = context.tracks.filter(
        (track) => track !== context.previousTrack,
    )
    const keepTrack =
        context.previousTrack !== null &&
        (context.roundIndex % GAIN_CONFIG.trackHoldRounds !== 0 ||
            others.length === 0)
    const track = keepTrack ? context.previousTrack! : context.rng.pick(others)

    // The full ladder is always offered, whatever the mode — the list is
    // something a player learns, and a list that changes shape with a setting
    // has to be relearned. The mode narrows what can be DRAWN, not what can
    // be seen, which is how EQ Detective handles boost/cut too.
    const pool =
        context.settings.mode === "louder"
            ? ladder.filter((db) => db >= 0)
            : context.settings.mode === "quieter"
              ? ladder.filter((db) => db <= 0)
              : ladder

    const deltaDb = context.rng.pick(pool.length > 0 ? pool : ladder)

    const passages = loudPassages(track.file, {
        minLevelDb: GAIN_CONFIG.quietPassageThresholdDb,
        earliestFraction: GAIN_CONFIG.trackStartEarliestFraction,
        latestFraction: GAIN_CONFIG.trackStartLatestFraction,
    })

    // No profile — a newly added track, or a checkout without ffmpeg. Fall
    // back to a random point rather than break.
    const offsetFraction =
        passages.length > 0
            ? context.rng.pick(passages)
            : GAIN_CONFIG.trackStartEarliestFraction +
              context.rng.next() *
                  (GAIN_CONFIG.trackStartLatestFraction -
                      GAIN_CONFIG.trackStartEarliestFraction)

    return {
        key: `r${context.roundIndex}`,
        track,
        trackOffsetFraction: offsetFraction,
        variants: [
            { id: "flat", label: "Original" },
            { id: "gain", label: "After gain", lockedDuringCountIn: true },
        ],
        revealVariantId: "gain",
        steps: [
            {
                id: "delta",
                prompt: "How much did the level change?",
                help:
                    `${ladder.length} options, from ` +
                    `${speakDb(ladder[0])} to ` +
                    `${speakDb(ladder[ladder.length - 1])}, in steps of ` +
                    `${level.stepDb} ${level.stepDb === 1 ? "decibel" : "decibels"}. ` +
                    `No change is one of them.`,
                options: ladder.map((db) => ({
                    id: optionId(db),
                    label: formatDb(db),
                    speech: speakDb(db),
                })),
            },
        ],
        correct: { delta: optionId(deltaDb) },
        params: { deltaDb, points: level.pointsPerCorrectAnswer },
    }
}

/**
 * One chain and a ramp on one gain, deliberately not two chains and a
 * crossfade.
 *
 * A GainNode at 1 is the exact identity — not approximately, the samples are
 * multiplied by one — so the reference state needs no second signal path, and
 * every intermediate value of the glide is a valid state of the same node.
 * The engine's parallel-chain invariant does not come into it, for the same
 * reason it does not in EQ Detective.
 *
 * The one thing that would break it is a step rather than a glide: assigning
 * to .value mid-playback jumps at a render quantum boundary, and a jump in
 * gain is a click that marks the switch and masks the first milliseconds of
 * the sound being judged — which in this game is the entire evidence.
 */
function buildAudio(rig: AudioRig, round: Round<GainParams>): GameAudio {
    const { ctx } = rig
    const { deltaDb } = round.params

    // Constant for the whole game, so it cannot become a cue.
    const headroom = new GainNode(ctx, { gain: dbToGain(-HEADROOM_DB) })
    const level = new GainNode(ctx, { gain: 1 })

    // A dedicated fade stage, separate from the level under test, so a round
    // can be swapped in and out without a step in the signal.
    const fade = new GainNode(ctx, { gain: 0 })

    rig.source.connect(headroom).connect(level).connect(fade).connect(rig.sink)

    ramp(fade.gain, 1, ctx, TEARDOWN_SECONDS)

    return {
        setVariant(variantId: string, at: number) {
            glide(
                level.gain,
                variantId === "flat" ? 1 : dbToGain(deltaDb),
                ctx,
                at,
            )
        },
        dispose() {
            const at = ctx.currentTime

            // Back to the reference before fading, so the overlap between the
            // outgoing and incoming chains is not itself a level change.
            glide(level.gain, 1, ctx, at)
            ramp(fade.gain, 0, ctx, TEARDOWN_SECONDS, at)

            window.setTimeout(() => {
                try {
                    // Without this the chain stays attached to the probe
                    // output and leaks a node per round; the context is a
                    // never closed singleton, so nothing else releases it.
                    rig.source.disconnect(headroom)
                } catch {
                    // Already detached — disconnect(node) throws then.
                }

                headroom.disconnect()
                level.disconnect()
                fade.disconnect()
            }, TEARDOWN_MS)
        },
    }
}

/** The signed decibels an option id stands for. */
function dbFromOptionId(id: string): number {
    const magnitude = Number(id.slice(1)) / 10

    return id.startsWith("n") ? -magnitude : magnitude
}

function judge(round: Round<GainParams>, given: Answer) {
    const chosen = given.delta
    const correct = chosen === round.correct.delta
    const { deltaDb, points } = round.params

    if (correct)
        return {
            correct: true,
            perStep: { delta: true },
            points,
            speech:
                deltaDb === 0
                    ? "Correct. Nothing changed."
                    : `Correct. ${speakDb(deltaDb)}.`,
        }

    return {
        correct: false,
        perStep: { delta: false },
        points: 0,
        speech:
            `Wrong. You chose ${speakDb(dbFromOptionId(chosen))}, but it was ` +
            `${speakDb(deltaDb)} — ${describeGap(dbFromOptionId(chosen), deltaDb)}.`,
    }
}

export function createGainTrainer(): GameSpec<GainParams, GainSettings> {
    return {
        id: "gain-trainer",
        name: "Gain Trainer",
        levels: GAIN_CONFIG.levels,
        defaultSettings: GAIN_CONFIG.defaultSettings,
        countInSeconds: GAIN_CONFIG.countInSeconds,
        lives: GAIN_CONFIG.lives,
        levelJitterDb: GAIN_CONFIG.roundLevelJitterDb,
        streakBonusPoints: GAIN_CONFIG.streakBonusPoints,
        streakBonusCap: GAIN_CONFIG.streakBonusCap,
        makeRound,
        buildAudio,
        judge,
        summarise({ rounds, correct, score, bestStreak, reason }) {
            const percent =
                rounds === 0 ? 0 : Math.round((correct / rounds) * 100)

            const prefix =
                reason === "time"
                    ? "Time is up. "
                    : reason === "lives"
                      ? "No lives left. "
                      : ""

            if (rounds === 0)
                return `${prefix}Training finished. No answers given.`

            return (
                `${prefix}Training finished after ${rounds} ` +
                `${rounds === 1 ? "round" : "rounds"}. ` +
                `${correct} correct, ${percent} percent. ` +
                `Score ${score}. Best streak ${bestStreak}.`
            )
        },
    }
}
