import {by, device, element, expect} from 'detox';

describe('BusListScreen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('nav-card-buses')).tap();
  });

  it('should render the bus list screen', async () => {
    await expect(element(by.id('bus-list-screen'))).toBeVisible();
  });

  it('should display the search input', async () => {
    await expect(element(by.id('search-input'))).toBeVisible();
  });

  it('should display the route count text', async () => {
    await expect(element(by.text(/총.*개 노선 중/))).toBeVisible();
  });

  it('should display route cards in the list', async () => {
    await expect(element(by.id('routes-flatlist'))).toBeVisible();
  });

  it('should filter routes when searching', async () => {
    await element(by.id('search-input')).typeText('10');
    await expect(element(by.text(/검색되었습니다/))).toBeVisible();
  });

  it('should clear search when clear button is tapped', async () => {
    await element(by.id('search-input')).typeText('10');
    await element(by.id('clear-search')).tap();
    await expect(element(by.id('search-input'))).toHaveText('');
  });

  it('should show empty results for non-matching search', async () => {
    await element(by.id('search-input')).typeText('zzzzz');
    await expect(element(by.id('empty-results'))).toBeVisible();
    await expect(element(by.text('검색 결과가 없습니다.'))).toBeVisible();
  });

  it('should navigate to BusDetail when route card is tapped', async () => {
    await element(by.id('route-card-10')).tap();
    await expect(element(by.id('bus-detail-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate back to home', async () => {
    await device.pressBack();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
