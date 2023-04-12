import streamlit as st
import pandas as pd
from core.modules.analysis import run_analysis


settings = {}

st.title("Analysis tool")
st.subheader("#")


csv_form = st.form(key="analysis_params")
with csv_form:
    prices_col, trades_col = st.columns(2)
    with prices_col:
        up_prices = st.file_uploader("Upload prices")
        if up_prices is not None:
            prices = pd.read_csv(up_prices)
    with trades_col:
        up_trades = st.file_uploader("Upload trades")  
        if up_trades is not None:
            trades = pd.read_csv(up_trades)

    cap_col, set_col = st.columns(2)
    with cap_col:
        capital = st.number_input("Starting capital", min_value=1, value=1000)
    with set_col:
        settings['date_filter'] = st.date_input("Date filter")
        settings['date_filter_active'] = st.checkbox("Use date filter", value=False)

    st.write(" ")
    with st.expander("dev options", expanded=False):
        settings['remove_hours'] = st.checkbox("Date compatibility mode", value=False)
    
    st.write("##")
    csv_submit = st.form_submit_button("Start!")


if csv_submit:
    with st.spinner(text="Processing..."):
        lines = run_analysis(prices, trades, capital, settings)
        if lines is not None:
            st.write("Total P&L")
            st.write(lines['equity'])
            st.write("##")
        
            st.write("Asset performance")
            st.write(lines['asset'])
            st.write("##")