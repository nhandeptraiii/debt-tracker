import pandas as pd
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def parse_excel(path):
    df = pd.read_excel(path)
    return df.head(10).to_json(orient='records', force_ascii=False)

f1 = r'd:\Projects\debt-tracker\BM quan ly Quy Phong.xlsx'
f2 = r'd:\Projects\debt-tracker\Quy rieng phong KHDN.xlsx'

data = {
    'BM_quan_ly_Quy_Phong': json.loads(parse_excel(f1)),
    'Quy_rieng_phong_KHDN': json.loads(parse_excel(f2))
}

with open(r'd:\Projects\debt-tracker\excel_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
