import { useState } from "react"

interface FocusAnchorProps {
    title: string
}

function FocusAnchor({ title }: FocusAnchorProps) {
    let [opened, setOpened] = useState(false)

    return (
        <h3
            tabIndex={-1}
            ref={(e) => {
                if (e && !opened) {
                    e.focus()
                    setOpened(true)
                }
            }}
        >
            {title}
        </h3>
    )
}

export default FocusAnchor
