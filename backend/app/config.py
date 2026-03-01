from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./rules.db"
    echo_sql: bool = False

    model_config = {"env_prefix": "RULES_"}


settings = Settings()
