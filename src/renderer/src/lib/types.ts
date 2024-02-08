export type Dict<T> = Record<string, T>;

export interface UserPreferences {
  sourceSelectorPaneSize: number;
  visPaneSize: number;
}

export interface Range {
  start: number;
  end: number;
}

export interface Subtitle extends Range {
  id: string;
  text: string;
  row: number;
}

export type SubtitleGroup = Subtitle & { contents: Subtitle[] };
