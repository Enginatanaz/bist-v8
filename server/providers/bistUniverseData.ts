import { BISTStock } from '../types.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

/**
 * Centrally managed Borsa Istanbul comprehensive equity universe.
 * Dynamically populated from the single-source-of-truth InstrumentUniverseService.
 */
export const BIST_COMPREHENSIVE_UNIVERSE: BISTStock[] =
  InstrumentUniverseService.getInstance().getAllInstruments();
