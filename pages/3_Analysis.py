import streamlit as st
import pandas as pd
from core.modules.analysis import run_analysis
from core.utils import combine_images
from plotly import io as p_io

st.set_page_config(layout="wide")

hide_streamlit_style = """
            <style>
            footer {visibility: hidden;}
            </style>
            """
st.markdown(hide_streamlit_style, unsafe_allow_html=True) 


settings = {}

st.title("Analysis tool")
st.subheader("#")

with st.expander("Form", expanded=True):
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
        

        settings['transpose_date_active'] = st.checkbox("Transpose trades", value=True)
        settings['transpose_date'] = st.number_input("Transpose trades by (hours)", min_value=0, value=168)
        settings['title'] = st.text_input("Title")

        st.write(" ")
        settings['remove_hours'] = st.checkbox("Date compatibility mode", value=False)
        st.write(" ")
    
        st.write("##")
        csv_submit = st.form_submit_button("Start!")


if csv_submit:
    with st.spinner(text="Processing..."):
        res = run_analysis(prices, trades, capital, settings)
        if res is not None:
            st.subheader(settings['title'])
            first_col, second_col, third_col = st.columns(3)
            with first_col:
                st.markdown("**Long trades:** " + res['long_n'])
                st.markdown("**Short trades:** " + res['short_n'])
            with second_col:
                st.markdown("**P&L ratio:** " + res['ratio'])
                st.markdown("**Max drawdown:** " + res['max_drawdown'])
            with third_col:
                st.markdown("**P&L ratio (hold):** " + res['ratio_hold'])
                st.markdown("**Max drawdown (hold):** " + res['max_drawdown_hold'])
            st.divider()

            eq_col, hold_col = st.columns(2)
            with eq_col:
                st.plotly_chart(res['equity'], use_container_width=True)
                st.plotly_chart(res['drawdown'] , use_container_width=True)
            with hold_col:
                st.plotly_chart(res['hold'], use_container_width=True)
                st.plotly_chart(res['drawdown_hold'], use_container_width=True)
            st.divider()
            st.write(res['asset'])
            

            # eq_png = p_io.to_image(res['equity'], format="png", engine="kaleido")
            # dd_png = p_io.to_image(res['drawdown'], format="png", engine="kaleido")

            # print(eq_png)
            # combine_images(2, 20, [eq_png, dd_png])