import { useState } from "react";
import axios from "axios";
import "./CadastroEndereco.css";
import Select from "react-select";

export default function CadastroEndereco() {
  const [login, setLogin] = useState("");
  const [membro, setMembro] = useState(null);
  const [endereco, setEndereco] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  // Lista de estados e cidades (expandida)
  const estados = {
    SP: [
      "São Paulo",
      "Campinas",
      "Santo André",
      "São Bernardo do Campo",
      "São Caetano do Sul",
      "Diadema",
      "Mauá",
      "Ribeirão Preto",
      "Piracicaba",
      "Jundiaí",
      "Bauru",
      "Sorocaba",
      "Osasco",
      "Guarulhos",
      "Osasco",
      "Sorocaba",
      "Santos",
      "São José dos Campos",
      "Mogi das Cruzes",
      "São José do Rio Preto",
    ],
    RJ: [
      "Rio de Janeiro",
      "Niterói",
      "Duque de Caxias",
      "Nova Iguaçu",
      "São Gonçalo",
      "Petrópolis",
      "Volta Redonda",
      "Campos dos Goytacazes",
      "Macaé",
      "Angra dos Reis",
      "Cabo Frio",
      "Teresópolis",
      "Nova Friburgo",
    ],
    MG: [
      "Belo Horizonte",
      "Uberlândia",
      "Juiz de Fora",
      "Contagem",
      "Betim",
      "Uberaba",
      "Montes Claros",
      "Governador Valadares",
      "Ipatinga",
      "Sete Lagoas",
      "Divinópolis",
      "Poços de Caldas",
      "Araguari",
      "Patos de Minas",
    ],
  };

  const estadosOptions = Object.keys(estados).map((uf) => ({
    value: uf,
    label: uf,
  }));

  // cidades dinâmicas
  const baseCidades = endereco.estado ? estados[endereco.estado] || [] : [];
  const cidadesComSelecionada =
    endereco.cidade && !baseCidades.includes(endereco.cidade)
      ? [endereco.cidade, ...baseCidades]
      : baseCidades;

  const cidadesOptions = cidadesComSelecionada.map((c) => ({
    value: c,
    label: c,
  }));

  // Validar login (CPF ou matrícula)
  const verificarLogin = async () => {
    try {
      const valor = login.trim();
      const res = await axios.get(
        `http://localhost:5000/membro/${valor}/verificar`
      );
      setMembro(res.data);
    } catch {
      alert("❌ CPF ou Matrícula não encontrado.");
    }
  };

  // Buscar CEP
  const buscarCep = async (cep) => {
    if (cep.length === 8) {
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!res.data.erro) {
          const uf = res.data.uf || "";
          const cidadeViaCep = res.data.localidade || "";

          setEndereco((e) => ({
            ...e,
            logradouro: capitalize(res.data.logradouro || ""),
            bairro: res.data.bairro || "",
            cidade: cidadeViaCep,
            estado: uf,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      }
    }
  };

  // Capitaliza a primeira letra
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // Controle de inputs
  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "cep") {
      value = value.replace(/\D/g, "").slice(0, 8);

      if (value === "") {
        // Se apagou o CEP → limpa os campos automáticos
        setEndereco({
          ...endereco,
          cep: "",
          logradouro: "",
          bairro: "",
          cidade: "",
          estado: "",
          numero: "",
          complemento: "",
        });
        return;
      }
    }

    if (name === "numero") value = value.replace(/\D/g, "");
    if (name === "cidade" || name === "logradouro") value = capitalize(value);

    setEndereco({ ...endereco, [name]: value });
    if (name === "cep") buscarCep(value);
  };

  // Controle dos selects
  const handleSelectEstado = (opt) => {
    setEndereco({ ...endereco, estado: opt?.value || "", cidade: "" });
  };

  const handleSelectCidade = (opt) => {
    setEndereco({ ...endereco, cidade: opt?.value || "" });
  };

  // Todos os campos obrigatórios (menos complemento)
  const enderecoCompleto =
    endereco.cep &&
    endereco.logradouro &&
    endereco.numero &&
    endereco.bairro &&
    endereco.cidade &&
    endereco.estado;

  
 // Salvar no backend de endereços (porta 5001)
const salvarEndereco = async () => {
  try {
    await axios.post("http://localhost:5001/enderecos", {
      matricula: membro.matricula,
      endereco
    });
    alert("✅ Endereço salvo separadamente!");
  } catch (err) {
    console.error("Erro ao salvar endereço:", err);
    alert("❌ Erro ao salvar endereço.");
  }
};


  // Estilo dos selects igual aos inputs
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "50px",
      borderRadius: "12px",
      borderColor: state.isFocused ? "#007bff" : "#d0d0d0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(0, 123, 255, 0.2)" : "none",
      "&:hover": { borderColor: "#007bff" },
      fontSize: "16px",
    }),
    valueContainer: (base) => ({ ...base, padding: "0 18px" }),
    placeholder: (base) => ({ ...base, color: "#999" }),
    singleValue: (base) => ({ ...base, color: "#333" }),
    menu: (base) => ({ ...base, borderRadius: 12, fontSize: 15, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#007bff"
        : state.isFocused
        ? "rgba(0,123,255,.08)"
        : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      cursor: "pointer",
    }),
  };

  return (
    <div className="container">
      <div className="box">
        <img src="/Logo AD Bras Final.png" alt="ADBRAS" className="logo" />

        {!membro ? (
          <>
            <h2>Digite seu CPF ou Matrícula</h2>
            <input
              type="text"
              placeholder="CPF ou Matrícula"
              value={login}
              onChange={(e) =>
                setLogin(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
            <button onClick={verificarLogin}>Entrar</button>
          </>
        ) : (
          <>
            {/* Dados do membro */}
            <div className="membro-perfil">
              <span className="membro-atividade">{membro.atividade}</span>
              <span className="membro-nome">{membro.nome}</span>
              <span className="membro-congregacao">{membro.congregacao}</span>
            </div>

            <h2>Cadastro de Endereço</h2>

            {/* CEP */}
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={endereco.cep}
              onChange={handleChange}
            />

            {/* Logradouro */}
            <input
              type="text"
              name="logradouro"
              placeholder="Logradouro"
              value={endereco.logradouro}
              onChange={handleChange}
            />

            {/* Número */}
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={endereco.numero}
              onChange={handleChange}
            />

            {/* Complemento (opcional) */}
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={endereco.complemento}
              onChange={handleChange}
            />

            {/* Bairro */}
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={endereco.bairro}
              onChange={handleChange}
            />

           {/* Estado */}
<Select
  classNamePrefix="rs"
  styles={selectStyles}
  placeholder="Selecione o Estado"
  options={estadosOptions}
  value={endereco.estado ? { value: endereco.estado, label: endereco.estado } : null}
  onChange={handleSelectEstado}
  isSearchable={false}
  isClearable={false}
/>

{/* Cidade */}
<Select
  classNamePrefix="rs"
  styles={selectStyles}
  placeholder="Selecione a Cidade"
  options={cidadesOptions}
  value={endereco.cidade ? { value: endereco.cidade, label: endereco.cidade } : null}
  onChange={handleSelectCidade}
  isDisabled={!endereco.estado}
  isSearchable={false}
  isClearable={false}
/>


            <button
              onClick={salvarEndereco}
              disabled={!enderecoCompleto}
              className={!enderecoCompleto ? "disabled" : ""}
            >
              Salvar Endereço
            </button>
          </>
        )}
      </div>
    </div>
  );
}
