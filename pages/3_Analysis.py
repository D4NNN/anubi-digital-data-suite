import streamlit as st
import pandas as pd
from core.modules.analysis import run_analysis

hide_streamlit_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            </style>
            """
st.markdown(hide_streamlit_style, unsafe_allow_html=True) 


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
        res = run_analysis(prices, trades, capital, settings)
        if res is not None:

            first_col, second_col, third_col = st.columns(3)
            with first_col:
                st.markdown("**Long trades:** " + res['long_n'])
                st.markdown("**Short trades:** " + res['short_n'])
            with second_col:
                st.markdown("**P&L ratio:** " + res['ratio'])
                st.markdown("**Max drawdown:** " + res['max_drawdown'])
            with third_col:
                st.write(" ")
                
            st.write(res['equity'])
            st.write(res['drawdown'])
            st.write(res['asset'])