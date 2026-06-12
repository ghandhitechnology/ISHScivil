// Next.js 15에서도 Next.js 16 스타일의 RouteContext 타입을 사용하기 위한 호환 타입
type RouteContext<_T extends string> = {
  params: Promise<Record<string, string>>;
};
