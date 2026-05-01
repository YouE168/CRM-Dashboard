// lib/constants.ts

export const COUNTY_LIST = [
  "Linn",
  "Bourbon",
  "Crawford",
  "Cherokee",
  "Labette",
  "Montgomery",
  "Woodson",
  "Wilson",
  "Allen",
  "Neosho",
  "Greenwood",
] as const;

export type County = typeof COUNTY_LIST[number];