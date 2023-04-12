import streamlit as st
from PIL import Image

hide_streamlit_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            </style>
            """
st.markdown(hide_streamlit_style, unsafe_allow_html=True) 


st.title('Anubi digital Data Suite')
st.divider()

st.title('Guides')

st.subheader("OHLC scraper")
st.markdown("**1. Username and Password**")
st.markdown("*Easy* as inputting your Tradingview credentials")
st.markdown("**2. Asset and Exchange**")
st.markdown("*Asset* and *Exchange* are found in the tradingview URL:")
st.code("https://it.tradingview.com/chart/USenGa4h/?symbol=BYBIT%3ABTCUSDT.P")
st.markdown("Asset: `BTCUSDT.P`, Exchange: `BYBIT`")
st.markdown("`%3A` is equal to `:` , don't include it in the asset")
st.markdown("**3. Timeframe**")
st.markdown("Input whichever timeframe you prefer (of the ones supported by tradingview):")
st.markdown("**Suffix**: Varies by unit, look at tradingview for accurate info")
st.markdown("**Postfix**: Minutes = **m**, Hours = **h**, Days = **D**, Weeks = **W**, Months = **M**")
st.code("Timeframe = Suffix + Postfix, es: 12W  45m  2W...")
st.warning("The technique used for scraping is vulnerable to captchas, try not to spam the scraping tool or you'll be blocked")
st.divider()

st.subheader("Indicator scraper")
st.markdown("**1. Username and Password**")
st.markdown("Same as OHLC")
st.markdown("**2. Asset, Exchange and Timeframe**")
st.markdown("Same as OHLC with a small caveat:")
st.markdown("The chosen timeframe **HAS** to be in the favorite timeframes (marked with a star in the dropdown list in tradingview) or already selected in the chart")
st.markdown("**3. Indicator**")
st.markdown("If the indicator is not in the dropwdown, you can use the 'custom' setting:")
st.markdown("* Chose 'custom' from the dropdown")
st.markdown("* Set the indicator's buy and sell 'positions'")
st.markdown("Consider the following:")
st.image(image=Image.open('rsc/pos_example.png'))
st.markdown("In this example, the buy signal is at position 10 and the sell's at position 11")
st.markdown("Start counting from after the indicator's name, some testing may be required")
st.markdown("**4. Chart code**")
st.markdown("Found in the URL")
st.code("https://it.tradingview.com/chart/USenGa4h/?symbol=BYBIT%3ABTCUSDT.P")
st.markdown("Chart: `USenGa4h`")
st.warning("The technique used for scraping is vulnerable to captchas, try not to spam the scraping tool or you'll be blocked")
st.divider()

st.subheader("Analysis tool")
st.markdown("Simply upload the required CSV's and wait for the magic")
