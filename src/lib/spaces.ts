import { PROJECTS } from './types';

// A "space" is a workspace you navigate into — today it maps 1:1 to a project.
// This module is the single seam to swap to DB-backed spaces later: make these
// async and fetch from a `spaces` table; no component would need to change.

export interface Space {
  id: string;
  name: string;
  color: string;
}

export function getSpaces(): readonly Space[] {
  return PROJECTS;
}

export function getSpace(id: string): Space | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export const defaultSpaceId: string = PROJECTS[0].id;
