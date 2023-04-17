import os
from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.chrome.options import Options
import time
import logging
from core.classes import DateMode
from core.utils import extract_custom_indicator, extract_market_spotter, extract_date, extract_sharp_shooter, to_signal, export_trades


driver_path = "./rsc/chromedriver"
signin_url = "https://www.tradingview.com/#signin"


class IndicatorScraper:

    def __init__(self, usr, pwd, asset, chart, cex, indicator, tf, buy_pos, sell_pos) -> None:
        self.usr = usr
        self.pwd = pwd
        self.asset = asset
        self.chart = chart
        self.cex = cex
        self.indicator = indicator
        self. tf = tf
        self.buy_pos = buy_pos
        self.sell_pos = sell_pos


    def __init_options(self):
        opts = Options()
        opts.add_argument("window-size=1920,1080")
        opts.add_argument(
            '--user-agent="Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 640 XL LTE)'
            ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10166"')
        opts.add_argument('--disable-blink-features=AutomationControlled')
        opts.add_experimental_option('prefs', {'credentials_enable_service': False})
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option('useAutomationExtension', False)
        # opts.add_argument("--headless=new")
        # opts.add_experimental_option("detach", True)
        return opts


    def __activate_auto(self, driver):
        auto_btn = WebDriverWait(driver, 4) \
            .until(expected_conditions.element_to_be_clickable((By.XPATH, "//div[@data-name='auto']")))
        if "isActive" not in auto_btn.get_attribute("class"):
            auto_btn.click()


    def __change_tf(self, driver):
        tf_container = WebDriverWait(driver, 6) \
            .until(expected_conditions.element_to_be_clickable((By.ID, "header-toolbar-intervals")))
        tfs = tf_container.find_elements(By.XPATH, ".//*")
        for i in tfs:
            if i.text == self.tf:
                i.click()


    def __login(self, driver):
        driver.get(signin_url)
        try:
            el = WebDriverWait(driver, 2) \
                .until(lambda d: d.find_element(By.CLASS_NAME, "tv-signin-dialog__toggle-email"))
            el.click()
            driver.find_element(By.NAME, "username").send_keys(self.usr)
            driver.find_element(By.NAME, "password").send_keys(self.pwd)
            driver.find_element(By.TAG_NAME, "form").submit()
            time.sleep(5)
        except:
            raise

    # def check_captcha(driver):
    #     try:
    #         container = WebDriverWait(driver, 10) \
    #             .until(lambda d: d.find_elements(By.XPATH, "//span[@contains(@class, 'recaptcha-checkbox')]"))
    #         for i in container:
    #             print(i.text)
    #             print(i.get_attribute("class"))
    #         # container = driver.find_element(By.XPATH, "//span[@role='checkbox']")
    #         # container.click()
    #     except Exception as e:
    #         print(e)


    def __check_loading(self, driver):
        container = driver.find_elements(By.XPATH, "//div[contains(@class, 'sources')]/div[contains(@class, 'eyeLoading')]")
        if container:
            time.sleep(3)
            self.__check_loading(driver)
        return


    # def check_disconnect(driver):
    #     el = driver.find_elements(By.XPATH, "//div[contains(@data-dialog-name, 'gopro')]./button[@aria-label='Close']")
    #     if el:
    #         el.click()

    
    def __get_indicator(self, ind_data):
        if self.indicator == 'custom':
            return extract_custom_indicator(ind_data, self.buy_pos - 1, self.sell_pos - 1)
        elif self.indicator == 'sharp_shooter':
            return extract_sharp_shooter(ind_data)
        elif self.indicator == 'market_spotter':
            return extract_market_spotter(ind_data)


    def __get_data(self, driver):
        self.__check_loading(driver)
        sources = driver.find_elements(By.XPATH, "//div[contains(@class, 'valuesWrapper')]")
        if sources[1] == '' or sources[2] == '':
            time.sleep(3)
            self.__check_loading(driver)
            sources = driver.find_elements(By.XPATH, "//div[contains(@class, 'valuesWrapper')]")
        indicator = self.__get_indicator(sources[1])
        date_state = sources[2].text.split("\n")
        date = extract_date(date_state[0], DateMode.hours)
        return {
            'indicator': indicator,
            'date': date,
            'last': to_signal(date_state[1])
        }


    def __get_chart(self, driver):
        driver.get("https://www.tradingview.com/chart/" + self.chart + "/?symbol=" + self.cex + "%3A" + self.asset)


    def __scrape(self, driver):
        scraping = True
        trades = []
        # self.__activate_auto(driver)
        time.sleep(0.2)
        price_axis = WebDriverWait(driver, 2).until(lambda d: d.find_element(By.CLASS_NAME, "price-axis-container"))
        chart_wrapper_width = WebDriverWait(driver, 2).until(lambda d: d.find_element(By.CLASS_NAME, "chart-gui-wrapper")).size['width']
        mouse_movement = ActionChains(driver).move_to_element_with_offset(price_axis, chart_wrapper_width - 20, 0)
        while scraping:
            mouse_movement.perform()
            data = self.__get_data(driver)
            if not data:
                ActionChains(driver).send_keys(Keys.ARROW_RIGHT).perform()
            else:
                trades.append(data)
                ActionChains(driver).send_keys(Keys.ARROW_LEFT).perform()
                if data['last']:
                    scraping = False
        return trades


    def run(self):

        start = time.time()

        logging.info("Instantiating Browser")
        browser = webdriver.Chrome(executable_path=driver_path, options=self.__init_options())
        browser.implicitly_wait(2)

        try:
            logging.info("Logging in")
            self.__login(browser)

            logging.info("Getting Chart")
            self.__get_chart(browser)

            logging.info("Changing timeframe")
            self.__change_tf(browser)

            logging.info("Scraping...")
            trades = self.__scrape(browser)

            browser.close()

            elapsed = str((time.time() - start) / 60)
            logging.info("Done in " + elapsed + "s")
        
            return export_trades(trades)
        except:
            raise
