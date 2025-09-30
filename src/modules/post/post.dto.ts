
export interface ICreatePostBodyDto {
  body: string;
  media?: string[];
}
export interface ILikeDto { postId: string; }
export interface IUnlikeDto { postId: string; }
