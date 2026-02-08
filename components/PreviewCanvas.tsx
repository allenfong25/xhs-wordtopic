import React, { forwardRef } from 'react';
import { UserProfile } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface PreviewCanvasProps {
  pageIndex: number;
  title?: string;
  bodyChunks: string[];
  profile: UserProfile;
  dateStr: string;
}

// Using forwardRef to allow parent to capture this DOM element
export const PreviewCanvas = forwardRef<HTMLDivElement, PreviewCanvasProps>(
  ({ pageIndex, title, bodyChunks, profile, dateStr }, ref) => {
    const isFirstPage = pageIndex === 0;

    return (
      <div
        ref={ref}
        className="relative bg-[#F8F9F4] font-song text-[#333333] flex flex-col box-border overflow-hidden"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          // 调整了 Padding：减小上下边距，给正文更多空间
          padding: '100px 90px', 
        }}
      >
        {/* Header - Only on First Page */}
        {isFirstPage && (
          <div className="absolute top-[100px] left-[90px] flex items-center gap-8 z-10">
            <div className="w-[100px] h-[100px] rounded-full bg-gray-200 overflow-hidden border border-gray-100 shadow-sm">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-sans">
                  {profile.username[0] || 'User'}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center h-full items-center">
              <span className="text-[36px] font-bold text-gray-800 leading-tight font-sans tracking-wide">
                {profile.username}
              </span>
              <span className="text-[36px] text-gray-500 leading-tight font-sans mt-2">
                {dateStr}
              </span>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div 
            className="flex-1 flex flex-col"
            // 移除了 gap-8，改用 paragraph 的 marginBottom 控制，避免间距双重叠加
            style={{
                marginTop: isFirstPage ? '180px' : '0px'
            }}
        >
            {/* Title - Only on First Page */}
            {isFirstPage && title && (
            <h1 
                className="font-bold mb-10 tracking-wide text-gray-900"
                style={{
                    fontSize: '80px',
                    lineHeight: '1.2'
                }}
            >
                {title}
            </h1>
            )}

            {/* Body Text */}
            <div className="flex-1 flex flex-col">
                {bodyChunks.map((chunk, idx) => (
                    <p 
                        key={idx} 
                        className="whitespace-pre-wrap text-justify tracking-wide text-[#2c2c2c]"
                        style={{
                            fontSize: '40px',
                            // 增加了行高：从 60px (1.5) -> 72px (1.8)，增加呼吸感
                            lineHeight: '72px', 
                            // 调整段间距：这里定义段落之间的距离
                            marginBottom: '48px' 
                        }}
                    >
                        {chunk}
                    </p>
                ))}
            </div>
        </div>

        {/* Footer/Page Number */}
        <div className="absolute bottom-10 right-10 text-gray-400 font-sans text-2xl">
            {pageIndex + 1}
        </div>
      </div>
    );
  }
);

PreviewCanvas.displayName = 'PreviewCanvas';