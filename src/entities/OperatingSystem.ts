export enum OperatingSystem {
    WINDOWS,
    LINUX,
    MAC_INTEL,
    MAC_ARM,
    UNKNOWN,
}

export function getOperatingSystemString(p: OperatingSystem): string {
    switch (p) {
        case OperatingSystem.WINDOWS:
            return "Windows"
        case OperatingSystem.LINUX:
            return "Linux"
        case OperatingSystem.MAC_INTEL:
            return "Intel-based Mac"
        case OperatingSystem.MAC_ARM:
            return "ARM-based Mac"
        case OperatingSystem.UNKNOWN:
            return "unknown"
    }
}
