import type { ArtifactSetKey } from '@genshin-optimizer/gi/consts'
import type { Data } from '@genshin-optimizer/gi/wr'
import {
  greaterEq,
  infoMut,
  input,
  percent,
  prod,
} from '@genshin-optimizer/gi/wr'
import { ArtifactSheet, setHeaderTemplate } from '../ArtifactSheet'
import type { IArtifactSheet } from '../IArtifactSheet'
import { dataObjForArtifactSheet } from '../dataUtil'

const key: ArtifactSetKey = 'OceanHuedClam'
const setHeader = setHeaderTemplate(key)

const set2 = greaterEq(input.artSet.OceanHuedClam, 2, percent(0.15))
const heal = greaterEq(
  input.artSet.OceanHuedClam,
  4,
  prod(prod(percent(0.9), 30000), input.enemy.physical_resMulti_)
)

export const data: Data = dataObjForArtifactSheet(
  key,
  {
    premod: {
      heal_: set2,
    },
  },
  {
    heal,
  }
)

const sheet: IArtifactSheet = {
  name: 'Ocean-Hued Clam',
  rarity: [4, 5],
  setEffects: {
    2: { document: [{ header: setHeader(2), fields: [{ node: set2 }] }] },
    4: {
      document: [
        {
          header: setHeader(4),
          fields: [
            {
              node: infoMut(heal, {
                name: ArtifactSheet.trm(key)('condName'),
                variant: 'physical',
              }),
            },
          ],
        },
      ],
    },
  },
}
export default new ArtifactSheet(key, sheet, data)
