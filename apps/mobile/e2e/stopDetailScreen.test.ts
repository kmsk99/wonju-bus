import {by, device, element, expect} from 'detox';

describe('StopDetailScreen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('nav-card-stops')).tap();
    // Tap the first terminal card
    const firstCard = element(by.id(/^terminal-card-/)).atIndex(0);
    await firstCard.tap();
  });

  it('should render the stop detail screen', async () => {
    await expect(element(by.id('stop-detail-screen'))).toBeVisible();
  });

  it('should display the stop detail header', async () => {
    await expect(element(by.id('stop-detail-header'))).toBeVisible();
  });

  it('should display the clock in the header', async () => {
    await expect(element(by.id('clock-component'))).toBeVisible();
  });

  it('should display the tabs', async () => {
    await expect(element(by.id('stop-detail-tabs'))).toBeVisible();
    await expect(element(by.id('tab-all'))).toBeVisible();
    await expect(element(by.id('tab-from'))).toBeVisible();
    await expect(element(by.id('tab-to'))).toBeVisible();
  });

  it('should switch to departure tab', async () => {
    await element(by.id('tab-from')).tap();
    await expect(element(by.id('tab-from'))).toBeVisible();
  });

  it('should switch to arrival tab', async () => {
    await element(by.id('tab-to')).tap();
    await expect(element(by.id('tab-to'))).toBeVisible();
  });

  it('should switch back to all tab', async () => {
    await element(by.id('tab-from')).tap();
    await element(by.id('tab-all')).tap();
    await expect(element(by.id('tab-all'))).toBeVisible();
  });

  it('should display the departure table section', async () => {
    await element(by.id('stop-detail-screen')).scroll(200, 'down');
    await expect(element(by.text('다음 출발 시간'))).toBeVisible();
  });

  it('should display bus departure table', async () => {
    await element(by.id('stop-detail-screen')).scroll(200, 'down');
    await expect(element(by.id('bus-departure-table'))).toBeVisible();
  });

  it('should display waiting time badges', async () => {
    await element(by.id('stop-detail-screen')).scroll(300, 'down');
    await expect(
      element(by.id('waiting-time')).atIndex(0),
    ).toBeVisible();
  });

  it('should display the routes list section', async () => {
    await element(by.id('stop-detail-screen')).scrollTo('bottom');
    await expect(element(by.text('노선 목록'))).toBeVisible();
  });

  it('should display routes list', async () => {
    await element(by.id('stop-detail-screen')).scrollTo('bottom');
    await expect(element(by.id('routes-list'))).toBeVisible();
  });

  it('should navigate to bus detail from departure table', async () => {
    await element(by.id('stop-detail-screen')).scroll(200, 'down');
    const firstRow = element(by.id(/^departure-row-/)).atIndex(0);
    await firstRow.tap();
    await expect(element(by.id('bus-detail-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate to bus detail from routes list', async () => {
    await element(by.id('stop-detail-screen')).scrollTo('bottom');
    const firstRoute = element(by.id(/^route-card-/)).atIndex(0);
    await firstRoute.tap();
    await expect(element(by.id('bus-detail-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate back to stops list', async () => {
    await device.pressBack();
    await expect(element(by.id('stops-list-screen'))).toBeVisible();
  });
});
