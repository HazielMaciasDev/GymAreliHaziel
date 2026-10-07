interface ExerciseMediaProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void;
}

export function ExerciseMedia({ src, alt, className, loading = 'lazy', onError }: ExerciseMediaProps) {
  const ext = src.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'gif') {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={onError as React.ReactEventHandler<HTMLImageElement>}
      />
    );
  }
  return (
    <video
      src={src}
      className={className}
      autoPlay
      playsInline
      muted
      loop
      preload={loading === 'eager' ? 'auto' : 'metadata'}
      onError={onError as React.ReactEventHandler<HTMLVideoElement>}
    >
      {alt && <track kind="captions" />}
    </video>
  );
}