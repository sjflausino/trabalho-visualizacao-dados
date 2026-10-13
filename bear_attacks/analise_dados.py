import duckdb

arquivo = "data/north_america_bear_killings.csv"

con = duckdb.connect()

# Verifica os nomes e os tipos das colunas.
estrutura = con.execute("""
    DESCRIBE
    SELECT *
    FROM read_csv_auto(?)
""", [arquivo]).fetchdf()

print("Estrutura do dataset:")
print(estrutura)

# Exibe uma amostra dos registros.
amostra = con.execute("""
    SELECT *
    FROM read_csv_auto(?)
    LIMIT 10
""", [arquivo]).fetchdf()

print("\nAmostra dos registros:")
print(amostra)

# 1. Quantidade total de registros e período coberto.
resumo = con.execute("""
    SELECT
        COUNT(*) AS total_registros,
        MIN(Year) AS primeiro_ano,
        MAX(Year) AS ultimo_ano,
        COUNT(DISTINCT Year) AS anos_com_registros
    FROM read_csv_auto(?)
""", [arquivo]).fetchdf()

print("\nResumo do dataset:")
print(resumo)

# 2. Verifica valores ausentes nas colunas mais relevantes.
ausentes = con.execute("""
    SELECT
        COUNT(*) AS total,
        COUNT(*) - COUNT(age) AS idade_ausente,
        COUNT(*) - COUNT(gender) AS genero_ausente,
        COUNT(*) - COUNT(Date) AS data_ausente,
        COUNT(*) - COUNT("Type of bear") AS tipo_urso_ausente,
        COUNT(*) - COUNT(Location) AS local_ausente
    FROM read_csv_auto(?)
""", [arquivo]).fetchdf()

print("\nValores ausentes:")
print(ausentes)

# 3. Conta os registros por tipo de urso.
tipos_urso = con.execute("""
    SELECT
        "Type of bear" AS tipo_urso,
        COUNT(*) AS total_registros
    FROM read_csv_auto(?)
    GROUP BY "Type of bear"
    ORDER BY total_registros DESC
""", [arquivo]).fetchdf()

print("\nRegistros por tipo de urso:")
print(tipos_urso)

# 4. Identifica datas e descrições que aparecem em várias linhas.
grupos = con.execute("""
    SELECT
        Date,
        Description,
        COUNT(*) AS quantidade_vitimas
    FROM read_csv_auto(?)
    GROUP BY Date, Description
    HAVING COUNT(*) > 1
    ORDER BY quantidade_vitimas DESC
    LIMIT 20
""", [arquivo]).fetchdf()

print("\nPossíveis incidentes com múltiplas vítimas:")
print(grupos)

# 5. Conta os registros por década.
decadas = con.execute("""
    SELECT
        CAST(FLOOR(Year / 10.0) * 10 AS INTEGER) AS decada,
        COUNT(*) AS total_vitimas
    FROM read_csv_auto(?)
    GROUP BY decada
    ORDER BY decada
""", [arquivo]).fetchdf()

print("\nRegistros por década:")
print(decadas)

# 6. Prepara os dados para o gráfico por tipo de urso.
por_tipo = con.execute("""
    SELECT
        "Type of bear" AS tipo_urso,
        COUNT(*) AS total_registros
    FROM read_csv_auto(?)
    GROUP BY "Type of bear"
    ORDER BY total_registros DESC
""", [arquivo]).fetchdf()

print("\nDados para o redesign por tipo de urso:")
print(por_tipo)


con.close()