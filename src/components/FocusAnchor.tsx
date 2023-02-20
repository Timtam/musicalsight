interface FocusAnchorProps {
    title: string
}

function FocusAnchor({ title }: FocusAnchorProps) {
    return (
        <h3
            tabIndex={-1}
            ref={(e) => {
                if (e) e.focus()
            }}
        >
            {title}
        </h3>
    )
}

export default FocusAnchor
