use serde::Serialize;

/// Error type returned to the frontend. Keeps technical details out of the
/// message shown to the user while still logging them locally.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Não foi possível acessar o banco de dados local.")]
    Database(#[from] rusqlite::Error),
    #[error("Não foi possível ler ou gravar um arquivo necessário.")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Validation(String),
    #[error("Registro não encontrado.")]
    NotFound,
    #[error("O arquivo selecionado não é um backup válido do Gerenciador de Lucros.")]
    InvalidBackup,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        crate::logging::log_error(&self.to_string(), &format!("{:?}", self));
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
