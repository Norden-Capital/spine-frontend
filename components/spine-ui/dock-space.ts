/**
 * Bottom padding for a page under the fixed dock, so the last item is never
 * hidden. (The body already pads the safe area, see app/globals.css.)
 * Plain module (not "use client"), so server components can use the string.
 */
export const DOCK_SPACE_CLASS = "pb-[calc(var(--sp-dock-h)+var(--sp-dock-gap)+16px)]";
