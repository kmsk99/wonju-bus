import {by, device, element, expect} from 'detox';

describe('BusDetailScreen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('nav-card-buses')).tap();
    await element(by.id('route-card-10')).tap();
  });

  it('should render the bus detail screen', async () => {
    await expect(element(by.id('bus-detail-screen'))).toBeVisible();
  });

  it('should display the route info card', async () => {
    await expect(element(by.id('route-info-card'))).toBeVisible();
    await expect(element(by.text('노선 정보'))).toBeVisible();
  });

  it('should display route origin and destination', async () => {
    await expect(element(by.text('출발 종점'))).toBeVisible();
    await expect(element(by.text('도착 종점'))).toBeVisible();
  });

  it('should display first and last bus times', async () => {
    await expect(element(by.text('첫차'))).toBeVisible();
    await expect(element(by.text('막차'))).toBeVisible();
  });

  it('should display operation count and interval', async () => {
    await expect(element(by.text('운행 횟수'))).toBeVisible();
    await expect(element(by.text('배차 간격'))).toBeVisible();
  });

  it('should display day type tabs', async () => {
    await expect(
      element(by.id('day-tab-공통')),
    ).toBeVisible();
  });

  it('should switch day type tabs', async () => {
    await element(by.id('day-tab-공통')).tap();
    await expect(element(by.text(/운행 시간표 \(공통\)/))).toBeVisible();
  });

  it('should display operation cards', async () => {
    await element(by.id('bus-detail-screen')).scroll(200, 'down');
    await expect(element(by.id('operation-card-1'))).toBeVisible();
  });

  it('should expand operation card on tap', async () => {
    await element(by.id('bus-detail-screen')).scroll(200, 'down');
    await element(by.id('operation-card-1')).tap();
    await expect(element(by.id('expanded-info'))).toBeVisible();
  });

  it('should collapse expanded card on second tap', async () => {
    await element(by.id('bus-detail-screen')).scroll(200, 'down');
    await element(by.id('operation-card-1')).tap();
    await expect(element(by.id('expanded-info'))).toBeVisible();
    await element(by.id('operation-card-1')).tap();
    await expect(element(by.id('expanded-info'))).not.toBeVisible();
  });

  it('should display the status legend', async () => {
    await element(by.id('bus-detail-screen')).scrollTo('bottom');
    await expect(element(by.id('status-legend'))).toBeVisible();
    await expect(element(by.text('현재 운행 중 (±30분)'))).toBeVisible();
    await expect(element(by.text('운행 예정'))).toBeVisible();
    await expect(element(by.text('운행 완료'))).toBeVisible();
  });

  it('should navigate back to bus list', async () => {
    await device.pressBack();
    await expect(element(by.id('bus-list-screen'))).toBeVisible();
  });

  it('should navigate back to home from bus list', async () => {
    await device.pressBack();
    await device.pressBack();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
