import type { FilmHistoryRecord, IpRouteId } from "./ip-system";
import type { SeasonArchiveRecord, SeasonStanding } from "./studio-strategy-system";

export type HonorFilm = {
  id: string;
  title: string;
  year: number;
  genre: string;
  score: number;
  gross: number;
};

export type GenreHonor = HonorFilm;
export type ActingHonor = { actorId: number; name: string; title: "影帝" | "影后"; year: number; filmTitle: string };
export type IpHonorNode = { id: string; title: string; year: number; entry: number; route: IpRouteId; score: number; gross: number };
export type IpHonorSeries = { seriesId: string; title: string; genre: string; nodes: IpHonorNode[] };
export type RivalHonor = { id: string; name: string; year: number; playerScore: number; rivalScore: number };
export type SeasonTitleHonor = SeasonArchiveRecord;

export type HonorLedger = {
  coreStyleIds: string[];
  connectionIds: string[];
  genreRecords: Record<string, GenreHonor>;
  highestGrossFilm: HonorFilm | null;
  actingHonors: ActingHonor[];
  ipSeries: IpHonorSeries[];
  defeatedRivals: RivalHonor[];
  seasonTitles: SeasonTitleHonor[];
};

export const emptyHonorLedger = (): HonorLedger => ({
  coreStyleIds: [],
  connectionIds: [],
  genreRecords: {},
  highestGrossFilm: null,
  actingHonors: [],
  ipSeries: [],
  defeatedRivals: [],
  seasonTitles: [],
});

export function normalizeHonorLedger(value?: Partial<HonorLedger> | null): HonorLedger {
  const empty = emptyHonorLedger();
  return {
    coreStyleIds: [...new Set(value?.coreStyleIds ?? empty.coreStyleIds)],
    connectionIds: [...new Set(value?.connectionIds ?? empty.connectionIds)],
    genreRecords: value?.genreRecords ?? empty.genreRecords,
    highestGrossFilm: value?.highestGrossFilm ?? null,
    actingHonors: value?.actingHonors ?? empty.actingHonors,
    ipSeries: value?.ipSeries ?? empty.ipSeries,
    defeatedRivals: value?.defeatedRivals ?? empty.defeatedRivals,
    seasonTitles: value?.seasonTitles ?? empty.seasonTitles,
  };
}

const filmId = (film: FilmHistoryRecord) => film.id ?? `legacy-${film.year ?? 0}-${film.title}`;
const honorFilm = (film: FilmHistoryRecord): HonorFilm => ({
  id: filmId(film),
  title: film.title,
  year: film.year ?? 0,
  genre: film.genre ?? "未归档题材",
  score: film.score ?? 0,
  gross: film.gross,
});

const seriesNode = (film: FilmHistoryRecord, fallbackEntry = 1): IpHonorNode => ({
  id: filmId(film),
  title: film.title,
  year: film.year ?? 0,
  entry: film.seriesEntry ?? fallbackEntry,
  route: film.route ?? "original",
  score: film.score ?? 0,
  gross: film.gross,
});

export function recordFilmHonor(ledger: HonorLedger, input: {
  film: FilmHistoryRecord;
  source?: FilmHistoryRecord | null;
  coreStyleId?: string | null;
  connectionIds?: string[];
  actingHonor?: ActingHonor | null;
}) {
  const next = normalizeHonorLedger(ledger);
  const film = honorFilm(input.film);
  const previousGenre = next.genreRecords[film.genre];
  const genreRecords = !previousGenre || film.score > previousGenre.score ? { ...next.genreRecords, [film.genre]: film } : next.genreRecords;
  const highestGrossFilm = !next.highestGrossFilm || film.gross > next.highestGrossFilm.gross ? film : next.highestGrossFilm;
  const coreStyleIds = input.coreStyleId ? [...new Set([...next.coreStyleIds, input.coreStyleId])] : next.coreStyleIds;
  const connectionIds = [...new Set([...next.connectionIds, ...(input.connectionIds ?? [])])];
  const actingHonors = input.actingHonor && !next.actingHonors.some((item) => item.actorId === input.actingHonor?.actorId && item.title === input.actingHonor?.title)
    ? [input.actingHonor, ...next.actingHonors]
    : next.actingHonors;

  let ipSeries = next.ipSeries;
  const seriesId = input.film.seriesId;
  if (seriesId) {
    const previous = next.ipSeries.find((series) => series.seriesId === seriesId);
    const candidates = [
      ...(previous?.nodes ?? []),
      ...(input.source ? [seriesNode(input.source, 1)] : []),
      seriesNode(input.film),
    ];
    const nodes = [...new Map(candidates.map((node) => [node.id, node])).values()].sort((first, second) => first.entry - second.entry || first.year - second.year);
    const updated: IpHonorSeries = {
      seriesId,
      title: input.film.seriesTitle ?? input.source?.seriesTitle ?? input.source?.title ?? input.film.title,
      genre: input.film.genre ?? input.source?.genre ?? "未归档题材",
      nodes,
    };
    ipSeries = previous ? next.ipSeries.map((series) => series.seriesId === seriesId ? updated : series) : [updated, ...next.ipSeries];
  }

  return { ...next, coreStyleIds, connectionIds, genreRecords, highestGrossFilm, actingHonors, ipSeries };
}

export function recordActingHonor(ledger: HonorLedger, honor: ActingHonor) {
  const next = normalizeHonorLedger(ledger);
  if (next.actingHonors.some((item) => item.actorId === honor.actorId && item.title === honor.title)) return next;
  return { ...next, actingHonors: [honor, ...next.actingHonors] };
}

export function recordSeasonHonor(ledger: HonorLedger, archive: SeasonArchiveRecord, standings: SeasonStanding[]) {
  const next = normalizeHonorLedger(ledger);
  const player = standings.find((entry) => entry.player);
  if (!player) return next;
  const defeated = standings.filter((entry) => !entry.player && entry.score < player.score).map((entry) => ({ id: entry.id, name: entry.name, year: archive.endYear, playerScore: player.score, rivalScore: entry.score }));
  const defeatedRivals = [...next.defeatedRivals];
  defeated.forEach((record) => {
    if (!defeatedRivals.some((item) => item.id === record.id)) defeatedRivals.push(record);
  });
  const seasonTitles = next.seasonTitles.some((item) => item.startYear === archive.startYear)
    ? next.seasonTitles.map((item) => item.startYear === archive.startYear ? archive : item)
    : [archive, ...next.seasonTitles];
  return { ...next, defeatedRivals, seasonTitles };
}
