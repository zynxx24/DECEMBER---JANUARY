from flask import Flask, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

# Nama file Excel
FILE_PATH_DATA = "data.xlsx"
FILE_PATH_DRAFT = "saved.xlsx"
FILE_PATH_ACCOUNT= "auth.xlsx"


# Helper function
def load_excel_data():
    """Load data dari file Excel."""
    if os.path.exists(FILE_PATH_DATA):
        return pd.read_excel(FILE_PATH_DATA)
    return pd.DataFrame(columns=["Nama", "Jumlah Kas"])  

def load_excel_draft():
    """Load data dari file Excel."""
    if os.path.exists(FILE_PATH_DRAFT):
        return pd.read_excel(FILE_PATH_DRAFT)
    return pd.DataFrame(columns=["Nama", "Jumlah Kas"])  

def load_excel_auth():
    """Load data dari file Excel."""
    if os.path.exists(FILE_PATH_ACCOUNT):
        return pd.read_excel(FILE_PATH_ACCOUNT)
    return pd.DataFrame(columns=["Nama", "Jumlah Kas"])  

def save_excel_data(df):
    """Simpan data ke file Excel."""
    df.to_excel(FILE_PATH_DATA, index=False, engine="openpyxl")

def save_excel_draft(df):
    """Simpan data ke file Excel."""
    df.to_excel(FILE_PATH_DRAFT, index=False, engine="openpyxl")

def save_excel_auth(df):
    """Simpan data ke file Excel."""
    df.to_excel(FILE_PATH_ACCOUNT, index=False, engine="openpyxl")

@app.route("/update_data", methods=["POST"])
def update_kas():
    """Update jumlah kas berdasarkan nama."""
    data = request.json
    nama = data.get("nama")
    kas = float(data.get("jumlah_bayar_kas", 0))  
    print(data)
    print(f'{nama} {kas}')

    if not nama:
        return jsonify({"error": "Nama wajib diisi."}), 400

    df = load_excel_data()

    # Ensure 'Jumlah Bayar Kas' is numeric
    df['Jumlah Bayar Kas'] = pd.to_numeric(df['Jumlah Bayar Kas'], errors='coerce').fillna(0)

    if nama in df['Nama'].values:
        # Debug: Before update
        print("Before Update:", df.loc[df['Nama'] == nama])

        # Update jumlah kas
        df.loc[df['Nama'] == nama, 'Jumlah Bayar Kas'] += kas

        # Debug: After update
        print("After Update:", df.loc[df['Nama'] == nama])
    else:
        # Add new row if nama doesn't exist
        new_row = {"Nama": nama, "Jumlah Bayar Kas": kas}
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    save_excel_data(df)
    print(df)

    df = load_excel_draft()

    if nama in df['Nama'].values:
        status = None
        # Update jumlah kas dan status
        df.loc[df['Nama'] == nama, 'Jumlah Bayar Kas'] = kas - kas
        df.loc[df['Nama'] == nama, 'Status'] = status
        print(df)
    save_excel_data(df)
    return jsonify({"message": f"Jumlah kas untuk '{nama}' berhasil diperbarui."})


@app.route("/draft", methods=["POST"])
def draft():
    data = request.json
    nama = data.get("nama")
    jumlah_bayar_kas = data.get("got", 0)
    status = data.get("sst")
    print(data)

    try:
        jumlah_bayar_kas = float(jumlah_bayar_kas)
    except ValueError:
        return jsonify({"error": "Jumlah Bayar Kas harus berupa angka."}), 400

    df = load_excel_draft()

    if nama in df['Nama'].values:
        # Update jumlah kas dan status
        df.loc[df['Nama'] == nama, 'Jumlah Bayar Kas'] += jumlah_bayar_kas
        df.loc[df['Nama'] == nama, 'Status'] = status  # Update kolom Status
        print(df)
        
    else:
        # Tambahkan baris baru jika nama belum ada
        new_row = {"Nama": nama, "Jumlah Kas": jumlah_bayar_kas, "Status": status}
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    save_excel_draft(df)
    print(df)
    return jsonify({"message": f"Jumlah kas dan status untuk '{nama}' berhasil diperbarui."})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    print(data)

    df = load_excel_auth()

    if username in df['Nama'].values:
        df.loc[df['Nama'] == username, 'Checkin Count'] = +1
        print(df)

    save_excel_auth(df)
    print(df)
    return jsonify({"message": f"Jumlah kas dan status untuk '{username}' berhasil diperbarui."})

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username dan password harus diisi."}), 400

    df = load_excel_auth()

    # Cek apakah username sudah ada
    if username in df['Nama'].values:
        # Update Checkin Count dan Password
        df.loc[df['Nama'] == username, 'Checkin Count'] += 1
        df.loc[df['Nama'] == username, 'Password'] = password
    else:
        # Tambahkan data baru jika username tidak ditemukan
        new_data = {"Nama": username, "Password": password, "Checkin Count": 1}
        df = df.append(new_data, ignore_index=True)

    save_excel_auth(df)
    return jsonify({"message": f"Data untuk '{username}' berhasil diperbarui atau ditambahkan."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
