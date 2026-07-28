from pydantic import BaseModel, ConfigDict, Field


class LichessRatings(BaseModel):
    bullet: int | None = None
    blitz: int | None = None
    rapid: int | None = None
    classical: int | None = None


class LichessUserResponse(BaseModel):
    username: str
    title: str | None = None
    profile_url: str
    country: str | None = None
    fide_rating: int | None = None
    ratings: LichessRatings
    verified: bool = True


class LichessProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    country: str | None = None
    bio: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    fide_rating: int | None = Field(default=None, alias="fideRating")
    links: str | None = None
