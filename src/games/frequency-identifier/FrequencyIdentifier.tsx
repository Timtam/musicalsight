import { useEffect, useMemo, useRef, useState } from "react"
import Button from "react-bootstrap/Button"
import { useEffectEvent } from "use-effect-event"
import Assets from "../../assets"
import FA from "../../components/FocusAnchor"
import Asset from "../../entities/Asset"

const LEVELS: Map<number, number[]> = new Map([
    [1, [150, 800, 3000, 8000]],
    [2, [100, 200, 400, 800, 2500, 6000, 12000]],
    [3, [750, 3500]],
])

const GAIN_DIFF = 6

interface FrequencyIdentifierProps {
    level: number
}

export default function FrequencyIdentifier({
    level,
}: FrequencyIdentifierProps) {
    const audioCtx = useMemo(() => new AudioContext(), [])
    const [asset, setAsset] = useState<Asset | undefined>(undefined)
    const audioElement = useRef<HTMLAudioElement>(null)
    const audioNode = useRef<MediaElementAudioSourceNode | null>(null)
    const eqNode = useRef<BiquadFilterNode | null>(null)
    const [frequency, setFrequency] = useState<number>(0)
    const [gain, setGain] = useState(0)
    const [countIn, setCountIn] = useState(0)
    const anchor = useRef<HTMLElement>(null)

    const start = useEffectEvent((frequencies: number[]) => {
        let countIn = 5

        anchor.current?.focus()

        let a = asset

        while (a === asset) {
            a = Assets[Math.floor(Math.random() * Assets.length)]
        }

        setAsset(a)
        setGain(0)
        setCountIn(countIn)

        const timer = setInterval(() => {
            countIn -= 1

            setCountIn(countIn)

            if (countIn === 0) {
                const freq =
                    frequencies[Math.floor(Math.random() * frequencies.length)]
                setFrequency(freq)
                eqNode.current!.frequency.value = Math.round(freq)

                clearInterval(timer!)
                setGain(GAIN_DIFF)
            }
        }, 1000)
    })

    useEffect(() => {
        if (!audioNode.current) {
            audioNode.current = audioCtx.createMediaElementSource(
                audioElement.current!,
            )
            eqNode.current = audioCtx.createBiquadFilter()

            eqNode.current!.type = "peaking"
            eqNode.current!.gain.value = gain

            audioNode
                .current!.connect(eqNode.current!)
                .connect(audioCtx.destination)

            if (audioCtx.state === "suspended") audioCtx.resume()

            start(LEVELS.get(level)!)
        }
    }, [audioCtx, audioNode, eqNode, level, start])

    useEffect(() => {
        if (eqNode.current) eqNode.current.gain.value = gain
    }, [eqNode, gain])

    return (
        <>
            <audio
                ref={audioElement}
                autoPlay
                loop={true}
                controls={false}
                src={asset?.url}
            />
            <FA
                ref={anchor}
                title={
                    countIn === 0
                        ? "Choose the frequency that got boosted"
                        : `The original tune will player for another ${countIn} seconds.`
                }
            />
            <ul
                style={{ listStyleType: "none" }}
                aria-label="Choose the frequency that got boosted"
            >
                {LEVELS.get(level)!.map((f) => (
                    <li>
                        <Button
                            aria-pressed={false}
                            disabled={countIn > 0}
                            onClick={() => {
                                if (eqNode.current!.frequency.value === f)
                                    start(LEVELS.get(level)!)
                            }}
                        >{`${f} Hz`}</Button>
                    </li>
                ))}
            </ul>
            <Button
                aria-pressed={gain === 0}
                disabled={countIn > 0}
                onClick={() => {
                    if (gain === 0) setGain(GAIN_DIFF)
                    else setGain(0)
                }}
            >
                Toggle original
            </Button>
        </>
    )
}
