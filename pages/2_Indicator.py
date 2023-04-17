import streamlit as st
from core.modules.scraper import IndicatorScraper

hide_streamlit_style = """
            <style>
            footer {visibility: hidden;}
            </style>
            """
st.markdown(hide_streamlit_style, unsafe_allow_html=True) 


indicators = ["custom", "sharp_shooter", "market_spotter"]
# charts = ["USenGa4h", "TEST"]
# assets = ["BTCUSDT", "ETH"]
# cexs = ["BYBIT", "BINANCE"]
# tfs = ["W", "D"]


def scrape(params):
    ind = IndicatorScraper( params['usr'],  params['pwd'],  
                              params['asset'], params['chart'], 
                              params['cex'], params['indicator'],
                              params['tf'], params['buy_signal_pos'],
                              params['sell_signal_pos'])
    return ind.run()



st.title("Indicator scraper")
st.subheader("#")

form_values = {}
scrape_form = st.form(key="indicator_params")
with scrape_form:
    st.caption("Insert Tradingview credentials")
    usr_col, pwd_col = st.columns(2)
    with usr_col:
        form_values['usr'] = st.text_input("Email", value="")
    with pwd_col:
        form_values['pwd'] = st.text_input("Password", type="password", value="")
    
    st.caption("Select parameters")
    asset_col, cex_col, tf_col = st.columns(3)
    with asset_col:
        # form_values['asset'] = st.selectbox("Select asset", options=assets)v
        form_values['asset'] = st.text_input("Select asset", value="")
    with cex_col:
        # form_values['cex'] = st.selectbox("Select exchange", options=cexs)
        form_values['cex'] = st.text_input("Select exchange", value="")
    with tf_col:
        # form_values['tf'] = st.selectbox("Select timeframe", options=tfs)
        form_values['tf'] = st.text_input("Select timeframe", value="")
    
    ind_col, chart_col = st.columns(2)
    with ind_col:
        form_values['indicator'] = st.selectbox("Select indicator", options=indicators)
    with chart_col:
        # form_values['chart'] = st.selectbox("Select chart code", options=charts)
        form_values['chart'] = st.text_input("Select chart code", value="")

    with st.expander("Custom indicator options", expanded=False):
        buy_col, sell_col = st.columns(2)
        with buy_col:
            form_values['buy_signal_pos'] = st.number_input("Buy signal position", min_value=0, value=0)
        with sell_col:
            form_values['sell_signal_pos'] = st.number_input("Sell signal position", min_value=0, value=0)

    st.write("##")
    scrape_submit = st.form_submit_button("Scrape!")


if scrape_submit:
    missing = ""
    for k in form_values:
        if form_values[k] == '':
            missing += k + "  "
    if missing:
        st.error("**Missing parameters:**  " + missing)
    else:
        with st.spinner(text="This may take a while..."):
            res = scrape(form_values)
            if not res.empty:
                csv = res.to_csv(index=False).encode('utf-8')
                filename = "TRADES_" + form_values['asset'] +":"+ form_values['cex'] + "_" + form_values['tf'] + ".csv"
                st.download_button("Download CSV", csv, filename, "text/csv", key="download-df-csv")
                st.write(res)
            else:
                st.error("Scraping failed")


