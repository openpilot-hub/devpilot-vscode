export type TLoginType = 'gzh' | 'za' | 'zati';

export type LoginSuccessCallback = (e: { loginType: TLoginType; userInfo: TUserInfo }) => void;
export interface ILoginProvider {
  onLogin(onSuccess: LoginSuccessCallback): void;
  onDestroy(): void;
}

export type TUserInfo = {
  loginType: TLoginType;
  companyId: number;
  companyName: string;
  departmentId: number;
  email: string;
  id: number;
  token: string;
  username: string;
  userType: string;
  /**
   * 公众号登录
   */
  nickname: string;
  /**
   * 公众号登录
   */
  openid: string;
};
