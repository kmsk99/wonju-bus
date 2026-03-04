import {by, device, element, expect} from 'detox';

describe('StopsListScreen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('nav-card-stops')).tap();
  });

  it('should render the stops list screen', async () => {
    await expect(element(by.id('stops-list-screen'))).toBeVisible();
  });

  it('should display the search input', async () => {
    await expect(element(by.id('search-input'))).toBeVisible();
  });

  it('should display terminal cards in the list', async () => {
    await expect(element(by.id('stops-flatlist'))).toBeVisible();
  });

  it('should filter stops when searching', async () => {
    await element(by.id('search-input')).typeText('관설');
    await expect(
      element(by.id('terminal-card-관설동종점')),
    ).toBeVisible();
  });

  it('should clear search when clear button is tapped', async () => {
    await element(by.id('search-input')).typeText('관설');
    await element(by.id('clear-search')).tap();
    await expect(element(by.id('search-input'))).toHaveText('');
  });

  it('should show empty results for non-matching search', async () => {
    await element(by.id('search-input')).typeText('zzzzz');
    await expect(element(by.id('empty-results'))).toBeVisible();
    await expect(element(by.text('검색 결과가 없습니다.'))).toBeVisible();
  });

  it('should navigate to StopDetail when terminal card is tapped', async () => {
    await element(by.id('stops-flatlist')).scroll(100, 'down');
    const firstCard = element(by.id(/^terminal-card-/)).atIndex(0);
    await firstCard.tap();
    await expect(element(by.id('stop-detail-screen'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate back to home', async () => {
    await device.pressBack();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
