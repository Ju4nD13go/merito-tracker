import type { VacancyDataset, Vacancy } from "@/domain/contracts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON import outside src
import rawDataset from "../../data/vacancies.v1.json";

export const dataset: VacancyDataset = rawDataset as VacancyDataset;

export const vacancies: Vacancy[] = dataset.vacancies;