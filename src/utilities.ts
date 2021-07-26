export const mapNoteToName = (note: string): string => {
    note = note.toLowerCase();

    if (!isNaN(+note.slice(-1))) note = note.slice(0, -1);

    if (note.length > 1) {
        if (note.slice(-1) === "#") return note[0].toUpperCase() + " sharp";
        else if (note.slice(-1) === "b") return note[0].toUpperCase() + " flat";
    }
    return note[0].toUpperCase();
};

export const mapNoteToLink = (note: string): string => {
    note = note.toLowerCase();

    if (!isNaN(+note.slice(-1))) note = note.slice(0, -1);

    if (note.length > 1) {
        if (note.slice(-1) === "#") return note[0] + "-sharp";
        else if (note.slice(-1) === "b") return note[0] + "-flat";
    }
    return note[0];
};
