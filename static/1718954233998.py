import pymupdf
import pandas as pd

# reading header of the list (reestr name)
def reestr_name(path):
    doc = pymupdf.open(path)
    page = doc[0]
    wlist = page.get_text("words", delimiters=None)  # make the word list
    
    st = ''
    for w in wlist[:10]:
        st += w[4] + ' '
    return st[:-1]



def import_pdf(path):
    doc = pymupdf.open(path)
    
    cols = ['№ п/п', 'Назначение платежа', 'Код статьи',
       'Наименование статьи затрат укрупненной сметы', 'Статья ЕКБС',
       'Основание платежа (счет, КС, накладная и тд.)',
       'Реквизиты документа-основания платежа, обеспечение',
       'Полное наименование организации-получателя, ИНН, ОГРН',
       'Расчетный счет организации- получателя, банк', 'Сумма платежа, руб.', 'Срок платежа']
    
    res = pd.DataFrame(data = None, columns = cols)
    for i in range(len(doc)):
        page = doc[i] 
        tabs = page.find_tables()
        
        j = 0 # tables counter
        df = tabs[j].to_pandas()
        while df.shape[0] < 1:
            del df
            j +=1
            df = tabs[j].to_pandas()
            
        # concat frames if sheets more then 1
        df.columns = df.columns.str.replace('\n', ' ')
        if i>0:
            df = df.append(pd.Series(df.columns, index = cols), ignore_index = True)
            df = df[cols].copy()
        res = pd.concat([res, df]).reset_index(drop = True)

    # transforming dataframe
    res = res[~res['№ п/п'].isna()]
    res = res[~res['Код статьи'].isna()]
    res= res[res['Код статьи']!='']
    res = res.applymap(lambda x: x.replace('\n', ' ') if type(x) == str else x)

    # to_json format 
    json_string = print (res.to_json(force_ascii=False))
    return json_string

