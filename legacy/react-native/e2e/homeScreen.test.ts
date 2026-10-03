import {by, device, element, expect} from 'detox';

describe('HomeScreen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should render the home screen', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should display the hero title', async () => {
    await expect(element(by.text('원주시 버스 종점 출발 시간'))).toBeVisible();
  });

  it('should display the hero subtitle', async () => {
    await expect(
      element(by.text(/원주시 버스의 종점 출발 시간을 확인하고/)),
    ).toBeVisible();
  });

  it('should display the clock component', async () => {
    await expect(element(by.id('clock-component'))).toBeVisible();
  });

  it('should display the stops navigation card', async () => {
    await expect(element(by.id('nav-card-stops'))).toBeVisible();
    await expect(element(by.text('종점별 조회'))).toBeVisible();
  });

  it('should display the buses navigation card', async () => {
    await expect(element(by.id('nav-card-buses'))).toBeVisible();
    await expect(element(by.text('노선별 조회'))).toBeVisible();
  });

  it('should display the info banner', async () => {
    await element(by.id('home-screen')).scrollTo('bottom');
    await expect(element(by.id('info-banner'))).toBeVisible();
    await expect(element(by.text('데이터 최신화 정보'))).toBeVisible();
  });

  it('should navigate to StopsList when stops card is tapped', async () => {
    await element(by.id('nav-card-stops')).tap();
    await expect(element(by.id('stops-list-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate to BusList when buses card is tapped', async () => {
    await element(by.id('nav-card-buses')).tap();
    await expect(element(by.id('bus-list-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should display the footer', async () => {
    await element(by.id('home-screen')).scrollTo('bottom');
    await expect(
      element(by.text('© 2025 원주시 버스 종점 정보 서비스')),
    ).toBeVisible();
  });
});
