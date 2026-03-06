import { useMemo } from 'react';
import { useLocalStorageState } from './useLocalStorageState';

export type MasterDataKey = 'aircraft' | 'bases' | 'sorties';

export type MasterDataState = Record<MasterDataKey, string[]>;

const MASTER_DATA_STORAGE_KEY = 'tni-au-master-data';

const defaultMasterData: MasterDataState = {
  aircraft: ['F-16C TS-1601', 'T-50i TT-5008', 'CN-295 A-2901'],
  bases: ['Lanud Iswahjudi', 'Lanud Halim', 'Lanud Sultan Hasanuddin'],
  sorties: ['CAP', 'Training', 'Navigation', 'Night Ops']
};

export const useMasterData = () => {
  const [masterData, setMasterData] = useLocalStorageState<MasterDataState>(MASTER_DATA_STORAGE_KEY, defaultMasterData);

  const actions = useMemo(
    () => ({
      addItem: (key: MasterDataKey, value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        setMasterData((previous) => {
          if (previous[key].some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
            return previous;
          }
          return { ...previous, [key]: [...previous[key], trimmed] };
        });
      },
      updateItem: (key: MasterDataKey, index: number, value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        setMasterData((previous) => {
          const nextItems = [...previous[key]];
          if (index < 0 || index >= nextItems.length) return previous;

          const duplicateIndex = nextItems.findIndex((item, itemIndex) => item.toLowerCase() === trimmed.toLowerCase() && itemIndex !== index);
          if (duplicateIndex >= 0) return previous;

          nextItems[index] = trimmed;
          return { ...previous, [key]: nextItems };
        });
      },
      deleteItem: (key: MasterDataKey, index: number) => {
        setMasterData((previous) => {
          if (previous[key].length <= 1) return previous;
          return { ...previous, [key]: previous[key].filter((_, itemIndex) => itemIndex !== index) };
        });
      },
      reset: () => setMasterData(defaultMasterData)
    }),
    [setMasterData]
  );

  return { masterData, ...actions };
};
