import {getCurrentDayTypes, isDayTypeMatch, parseBusFileName} from '../model/dayTypeUtils';
import {BusData, DayType} from '../model/types';
import {busFiles, getBusData} from '../../../data/index';

const dataCache: {
  busData: Record<string, BusData>;
  busFilesByRoute: Record<string, string[]>;
  terminals: string[] | null;
  routesByTerminal: Record<string, string[]>;
  routesToTerminal: Record<string, string[]>;
  routesCountByTerminal: Record<string, number>;
  isVacation: boolean;
  isHoliday: boolean;
  initialized: boolean;
} = {
  busData: {},
  busFilesByRoute: {},
  terminals: null,
  routesByTerminal: {},
  routesToTerminal: {},
  routesCountByTerminal: {},
  isVacation: false,
  isHoliday: false,
  initialized: false,
};

export function loadAllBusData(): BusData[] {
  if (dataCache.initialized && Object.keys(dataCache.busData).length > 0) {
    return Object.values(dataCache.busData);
  }

  busFiles.forEach(filename => {
    const fileInfo = parseBusFileName(filename);
    if (!dataCache.busFilesByRoute[fileInfo.routeNumber]) {
      dataCache.busFilesByRoute[fileInfo.routeNumber] = [];
    }
    dataCache.busFilesByRoute[fileInfo.routeNumber].push(filename);
  });

  const results: BusData[] = [];

  for (const filename of busFiles) {
    const rawData = getBusData(filename);
    if (!rawData) {
      continue;
    }

    const data: BusData = {...rawData};
    data.fileName = filename;

    const fileInfo = parseBusFileName(filename);
    const operatesToday = isDayTypeMatch(
      fileInfo.dayTypeGroup,
      dataCache.isVacation,
      dataCache.isHoliday,
    );
    data.operatesToday = operatesToday;

    const routeNumber = data.routeInfo.routeNumber;
    if (!dataCache.busData[routeNumber] || operatesToday) {
      dataCache.busData[routeNumber] = data;
    }

    results.push(data);
  }

  dataCache.initialized = true;
  return results;
}

export function loadBusData(routeNumber: string): BusData | null {
  if (dataCache.busData[routeNumber]) {
    return dataCache.busData[routeNumber];
  }

  if (!dataCache.busFilesByRoute[routeNumber]) {
    loadAllBusData();
  }

  const files = dataCache.busFilesByRoute[routeNumber] || [];
  if (files.length === 0) {
    return null;
  }

  let matchingFiles: string[] = [];

  for (const file of files) {
    const fileInfo = parseBusFileName(file);
    if (
      isDayTypeMatch(
        fileInfo.dayTypeGroup,
        dataCache.isVacation,
        dataCache.isHoliday,
      )
    ) {
      matchingFiles.push(file);
    }
  }

  const fileToLoad = matchingFiles.length > 0 ? matchingFiles[0] : files[0];
  const operatesToday = matchingFiles.length > 0;

  const rawData = getBusData(fileToLoad);
  if (!rawData) {
    return null;
  }

  const busData: BusData = {...rawData};
  busData.fileName = fileToLoad;
  busData.operatesToday = operatesToday;

  dataCache.busData[routeNumber] = busData;
  return busData;
}

export function isRouteOperatingToday(routeNumber: string): boolean {
  const busData = loadBusData(routeNumber);
  if (!busData) {
    return false;
  }

  if (busData.operatesToday !== undefined) {
    return busData.operatesToday;
  }

  if (busData.fileName) {
    const fileInfo = parseBusFileName(busData.fileName);
    if (
      isDayTypeMatch(
        fileInfo.dayTypeGroup,
        dataCache.isVacation,
        dataCache.isHoliday,
      )
    ) {
      return true;
    }
  }

  if (busData.operationInfo && busData.operationInfo.length > 0) {
    const currentDayTypes = getCurrentDayTypes(
      dataCache.isVacation,
      dataCache.isHoliday,
    );
    return busData.operationInfo.some(
      op =>
        currentDayTypes.includes(op.category as DayType) ||
        op.category === '공통',
    );
  }

  return true;
}

export function loadTerminals(): string[] {
  if (dataCache.terminals) {
    return dataCache.terminals;
  }

  const busDataList = loadAllBusData();
  const terminals = new Set<string>();
  const routesCountByTerminal: Record<string, number> = {};

  busDataList.forEach(bus => {
    bus.operationInfo.forEach(op => {
      if (op.departureName !== '-') {
        terminals.add(op.departureName);
        routesCountByTerminal[op.departureName] =
          (routesCountByTerminal[op.departureName] || 0) + 1;
      }
      if (op.arrivalName !== '-') {
        terminals.add(op.arrivalName);
        routesCountByTerminal[op.arrivalName] =
          (routesCountByTerminal[op.arrivalName] || 0) + 1;
      }
    });
  });

  dataCache.routesCountByTerminal = routesCountByTerminal;

  const terminalsList = Array.from(terminals).sort(
    (a, b) =>
      (routesCountByTerminal[b] || 0) - (routesCountByTerminal[a] || 0),
  );

  dataCache.terminals = terminalsList;
  return terminalsList;
}

export function getRouteCountForTerminal(terminalName: string): number {
  return dataCache.routesCountByTerminal[terminalName] || 0;
}

export function loadRoutesByTerminal(terminalName: string): string[] {
  if (dataCache.routesByTerminal[terminalName]) {
    return dataCache.routesByTerminal[terminalName];
  }

  const busDataList = loadAllBusData();
  const routesFromTerminal = busDataList
    .filter(busData =>
      busData.operationInfo.some(op => op.departureName === terminalName),
    )
    .map(busData => busData.routeInfo.routeNumber);

  dataCache.routesByTerminal[terminalName] = routesFromTerminal;
  return routesFromTerminal;
}

export function loadRoutesToTerminal(terminalName: string): string[] {
  if (dataCache.routesToTerminal[terminalName]) {
    return dataCache.routesToTerminal[terminalName];
  }

  const busDataList = loadAllBusData();
  const routesToTerminal = busDataList
    .filter(busData =>
      busData.operationInfo.some(op => op.arrivalName === terminalName),
    )
    .map(busData => busData.routeInfo.routeNumber);

  dataCache.routesToTerminal[terminalName] = routesToTerminal;
  return routesToTerminal;
}

export function getTimeUntilNextBus(departureTime: string): number {
  const now = new Date();
  const [hours, minutes] = departureTime.split(':').map(Number);

  const departureDate = new Date();
  departureDate.setHours(hours);
  departureDate.setMinutes(minutes);
  departureDate.setSeconds(0);

  if (departureDate.getTime() < now.getTime()) {
    return -1;
  }

  const diffMs = departureDate.getTime() - now.getTime();
  return Math.floor(diffMs / 60000);
}

export function getAllDepartureTimesFromStop(stopName: string): Array<{
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes: number;
  category: string;
  isFromTerminal: boolean;
  isNextDay?: boolean;
  tripIndex?: number;
}> {
  const departureRoutes = loadRoutesByTerminal(stopName);
  const arrivalRoutes = loadRoutesToTerminal(stopName);
  const allRoutes = Array.from(new Set([...departureRoutes, ...arrivalRoutes]));

  const result: Array<{
    routeNumber: string;
    departureTime: string;
    nextDepartureMinutes: number;
    category: string;
    isFromTerminal: boolean;
    isNextDay?: boolean;
    tripIndex?: number;
  }> = [];

  for (const route of allRoutes) {
    const busData = loadBusData(route);
    if (!busData) {
      continue;
    }

    const tempTimes: Array<{
      departureTime: string;
      category: string;
      isFromTerminal: boolean;
      tripIndex?: number;
    }> = [];

    busData.operationInfo.forEach((op, index) => {
      if (op.departureName === stopName && op.departureTime !== '-') {
        tempTimes.push({
          departureTime: op.departureTime,
          category: op.category,
          isFromTerminal: true,
          tripIndex: index + 1,
        });
      }
    });

    busData.operationInfo.forEach((op, index) => {
      if (op.arrivalName === stopName && op.arrivalTime !== '-') {
        tempTimes.push({
          departureTime: op.arrivalTime,
          category: op.category,
          isFromTerminal: false,
          tripIndex: index + 1,
        });
      }
    });

    const getTimeMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    tempTimes.sort(
      (a, b) =>
        getTimeMinutes(a.departureTime) - getTimeMinutes(b.departureTime),
    );

    for (const item of tempTimes) {
      const now = new Date();
      const [hours, minutes] = item.departureTime.split(':').map(Number);
      const departureTime = new Date(now);
      departureTime.setHours(hours, minutes, 0, 0);

      let isNextDay = false;
      if (departureTime < now) {
        departureTime.setDate(departureTime.getDate() + 1);
        isNextDay = true;
      }

      const nextDepartureMinutes = Math.floor(
        (departureTime.getTime() - now.getTime()) / (1000 * 60),
      );

      result.push({
        routeNumber: route,
        departureTime: item.departureTime,
        nextDepartureMinutes,
        category: item.category,
        isFromTerminal: item.isFromTerminal,
        isNextDay,
        tripIndex: item.tripIndex,
      });
    }
  }

  const getTimeMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  result.sort(
    (a, b) =>
      getTimeMinutes(a.departureTime) - getTimeMinutes(b.departureTime),
  );

  return result;
}
