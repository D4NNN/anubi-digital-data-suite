import streamlit as st
from core.modules.scraper import IndicatorScraper


indicators = ["Sharp Shooter", "TEST"]
charts = ["USenGa4h", "TEST"]
assets = ["BTCUSDT", "ETH"]
cexs = ["BYBIT", "BINANCE"]
tfs = ["W", "D"]


def scrape(params):
    ind = IndicatorScraper( params['usr'],  params['pwd'],  
                              params['asset'], params['chart'], 
                              params['cex'], params['indicator'],
                                params['tf'])
    return ind.run()



st.title("Indicator scraper")
st.subheader("##")

form_values = {}
scrape_form = st.form(key="indicator_params")
with scrape_form:
    st.caption("Insert Tradingview credentials")
    usr_col, pwd_col = st.columns(2)
    with usr_col:
        form_values['usr'] = st.text_input("Username")
    with pwd_col:
        form_values['pwd'] = st.text_input("Password", type="password")
    
    st.caption("Select parameters")
    asset_col, cex_col, tf_col = st.columns(3)
    with asset_col:
        form_values['asset'] = st.selectbox("Select asset", options=assets)
    with cex_col:
        form_values['cex'] = st.selectbox("Select exchange", options=cexs)
    with tf_col:
        form_values['tf'] = st.selectbox("Select timeframe", options=tfs)
    
    ind_col, chart_col = st.columns(2)
    with ind_col:
        form_values['indicator'] = st.selectbox("Select indicator", options=indicators)
    with chart_col:
        form_values['chart'] = st.selectbox("Select chart code", options=charts)

    st.write("##")
    scrape_submit = st.form_submit_button("Scrape!")


if scrape_submit:
    with st.spinner(text="This may take a while..."):
        res = scrape(form_values)
        if not res.empty:
            csv = res.to_csv(index=False).encode('utf-8')
            filename = "TRADES_" + form_values['asset'] +":"+ form_values['cex'] + "_" + form_values['tf'] + ".csv"
            st.download_button("Download CSV", csv, filename, "text/csv", key="download-df-csv")
            st.write(res)
        else:
            st.error("scaping failed")


