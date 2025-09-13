import { useState, useEffect } from "react";
import axios from "axios";
import "./CadastroEndereco.css";
import Select from "react-select";

// 🔗 URLs dos backends (Render) com fallback para variáveis de ambiente do Vite/Netlify
const CENSO_API =
  import.meta?.env?.VITE_CENSO_API || "https://backend-censo-p8hr.onrender.com";
const ENDERECO_API =
  import.meta?.env?.VITE_ENDERECO_API || "https://backend-endereco.onrender.com";

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

  // ⬇️ NOVOS estados
  const [jaSalvou, setJaSalvou] = useState(false);
  const [mensagem, setMensagem] = useState("");

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

  // Quando o membro muda, verifica se já há registro salvo (persistido)
  useEffect(() => {
    if (membro?.matricula) {
      const chave = `endereco_salvo_${membro.matricula}`;
      setJaSalvou(localStorage.getItem(chave) === "true");
    } else {
      setJaSalvou(false);
    }
  }, [membro]);

  // Validar login (CPF ou matrícula) no backend do Censo (Render)
  const verificarLogin = async () => {
    try {
      const valor = login.trim();
      const res = await axios.get(`${CENSO_API}/membro/${valor}/verificar`);
      setMembro(res.data);
      setMensagem(""); // limpa mensagem ao entrar
    } catch (err) {
      console.error("Erro ao verificar login:", err);
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

  // Salvar no backend de endereços (Render)
  const salvarEndereco = async () => {
    // impede múltiplos salvamentos
    if (jaSalvou) {
      setMensagem("✅ Endereço já foi salvo. Não é possível salvar novamente.");
      return;
    }

    try {
      await axios.post(`${ENDERECO_API}/enderecos`, {
        matricula: membro.matricula,
        endereco,
      });

      // Marca sucesso, trava e persiste a trava
      setJaSalvou(true);
      setMensagem("✅ Endereço salvo com sucesso!");
      localStorage.setItem(`endereco_salvo_${membro.matricula}`, "true");
    } catch (err) {
      console.error("Erro ao salvar endereço:", err);
      setMensagem("❌ Erro ao salvar endereço. Tente novamente.");
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
            <h2>Digite seu CPF </h2>
            <input
              type="text"
              placeholder="CPF"
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

            {/* Mensagens */}
            {mensagem && (
              <div
                className="alerta"
                style={{
                  background: mensagem.startsWith("✅") ? "#e9f7ef" : "#fdecea",
                  color: mensagem.startsWith("✅") ? "#1e7e34" : "#b02a37",
                  border: "1px solid rgba(0,0,0,0.05)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  fontSize: "14px",
                }}
              >
                {mensagem}
              </div>
            )}

            {/* CEP */}
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={endereco.cep}
              onChange={handleChange}
              disabled={jaSalvou}
            />

            {/* Logradouro */}
            <input
              type="text"
              name="logradouro"
              placeholder="Logradouro"
              value={endereco.logradouro}
              onChange={handleChange}
              disabled={jaSalvou}
            />

            {/* Número */}
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={endereco.numero}
              onChange={handleChange}
              disabled={jaSalvou}
            />

            {/* Complemento (opcional) */}
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={endereco.complemento}
              onChange={handleChange}
              disabled={jaSalvou}
            />

            {/* Bairro */}
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={endereco.bairro}
              onChange={handleChange}
              disabled={jaSalvou}
            />

            {/* Estado */}
            <Select
              classNamePrefix="rs"
              styles={selectStyles}
              placeholder="Selecione o Estado"
              options={estadosOptions}
              value={
                endereco.estado
                  ? { value: endereco.estado, label: endereco.estado }
                  : null
              }
              onChange={handleSelectEstado}
              isSearchable={false}
              isClearable={false}
              isDisabled={jaSalvou}
            />

            {/* Cidade */}
            <Select
              classNamePrefix="rs"
              styles={selectStyles}
              placeholder="Selecione a Cidade"
              options={cidadesOptions}
              value={
                endereco.cidade
                  ? { value: endereco.cidade, label: endereco.cidade }
                  : null
              }
              onChange={handleSelectCidade}
              isDisabled={!endereco.estado || jaSalvou}
              isSearchable={false}
              isClearable={false}
            />

            <button
              onClick={salvarEndereco}
              disabled={!enderecoCompleto || jaSalvou}
              className={!enderecoCompleto || jaSalvou ? "disabled" : ""}
            >
              {jaSalvou ? "Endereço já salvo" : "Salvar Endereço"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
