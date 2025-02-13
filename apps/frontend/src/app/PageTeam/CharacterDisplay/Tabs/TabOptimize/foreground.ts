import { deepClone, objKeyMap, objMap } from '@genshin-optimizer/common/util'
import {
  allMainStatKeys,
  allSubstatKeys,
  artMaxLevel,
} from '@genshin-optimizer/gi/consts'
import type { ICachedArtifact } from '@genshin-optimizer/gi/db'
import { getMainStatValue } from '@genshin-optimizer/gi/util'
import type { Data, NumNode } from '@genshin-optimizer/gi/wr'
import {
  constant,
  formulaString,
  input,
  setReadNodeKeys,
} from '@genshin-optimizer/gi/wr'
import { computeUIData } from '../../../../Formula/api'
import type {
  ArtifactBuildData,
  ArtifactsBySlot,
  DynStat,
} from '../../../../Solver/common'
const dynamic = setReadNodeKeys(
  deepClone({ dyn: { ...input.art, ...input.artSet } })
)
export const dynamicData = {
  art: objKeyMap(
    [...allMainStatKeys, ...allSubstatKeys],
    (key) => dynamic.dyn[key]
  ),
  artSet: objMap(input.artSet, (_, key) => dynamic.dyn[key]),
}

export function compactArtifacts(
  arts: ICachedArtifact[],
  mainStatAssumptionLevel: number,
  allowPartial: boolean
): ArtifactsBySlot {
  const result: ArtifactsBySlot = {
    base: {},
    values: { flower: [], plume: [], goblet: [], circlet: [], sands: [] },
  }
  const keys = new Set<string>()

  for (const art of arts) {
    const mainStatVal = getMainStatValue(
      art.mainStatKey,
      art.rarity,
      Math.max(
        Math.min(mainStatAssumptionLevel, artMaxLevel[art.rarity]),
        art.level
      )
    )

    const data: ArtifactBuildData = {
      id: art.id,
      set: art.setKey,
      values: {
        [art.setKey]: 1,
        [art.mainStatKey]: mainStatVal,
        ...Object.fromEntries(
          art.substats.map((substat) => [
            substat.key,
            substat.key.endsWith('_')
              ? substat.accurateValue / 100
              : substat.accurateValue,
          ])
        ),
      },
    }
    delete data.values['']
    result.values[art.slotKey].push(data)
    Object.keys(data.values).forEach((x) => keys.add(x))
  }
  result.base = objKeyMap([...keys], (_) => 0)
  if (allowPartial)
    for (const value of Object.values(result.values))
      value.push({ id: '', values: {} })
  return result
}

export function debugCompute(
  nodes: NumNode[],
  base: DynStat,
  arts: ArtifactBuildData[]
) {
  const stats = { ...base }
  for (const art of arts) {
    for (const [key, value] of Object.entries(art.values)) {
      stats[key] = (stats[key] ?? 0) + value
    }
  }
  const data = {
    dyn: Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, constant(value)])
    ),
  } as Data
  const uiData = computeUIData([data])
  return {
    base,
    arts,
    stats,
    data,
    uiData,
    nodes: nodes.map(formulaString),
    results: nodes.map((node) => uiData.get(node)),
  }
}
