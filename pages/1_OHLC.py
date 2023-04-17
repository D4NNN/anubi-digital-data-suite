import streamlit as st
from core.modules.ws import WebsocketScraper

hide_streamlit_style = """
            <style>
            footer {visibility: hidden;}
            </style>
            """
st.markdown(hide_streamlit_style, unsafe_allow_html=True) 


def scrape(params):
    ws = WebsocketScraper( params['usr'],  params['pwd'], form_values['premium'],
                              params['asset'],  params['cex'],  
                              params['tf'],  params['candles'],  
                              params['keep_alive'])
    return ws.run()

st.title("OHLC scraper")
st.subheader("#")

form_values = {}
scrape_form = st.form(key="prices_params")
with scrape_form:
    st.caption("Insert Tradingview credentials")
    usr_col, pwd_col = st.columns(2)
    with usr_col:
        form_values['usr'] = st.text_input("Email", value="")
    with pwd_col:
        form_values['pwd'] = st.text_input("Password", type="password", value="")

    form_values['premium'] = st.checkbox("Premium account", value=True)

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
    st.write(" ")
    with st.expander("dev options", expanded=False):
        candles_col, conn_col = st.columns(2)
        with candles_col:
            form_values['candles'] = st.number_input("Number of candles", min_value=100, max_value=10000, value=10000)
        with conn_col:
            form_values['keep_alive'] = st.checkbox("Keep connection alive", value=False)
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
        with st.spinner(text="In progress..."):
            res = scrape(form_values)
            if not res.empty:
                csv = res.to_csv(index=False).encode('utf-8')
                filename = "PRICES_" + form_values['asset'] +":"+ form_values['cex'] + "_" + form_values['tf'] + ".csv"
                st.download_button("Download CSV", csv, filename, "text/csv", key="download-df-csv")
                st.write(res)
            else:
                st.error("Scraping failed")
