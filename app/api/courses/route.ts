import { NextRequest, NextResponse } from "next/server";
import { mockDataProvider } from "@/lib/data/mock-provider";
import type { CourseFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters: CourseFilters = {};
  
  const search = searchParams.get("search");
  if (search) filters.search = search;
  
  const audience = searchParams.get("audience");
  if (audience) filters.audience = audience.split(",") as any;
  
  const category = searchParams.get("category");
  if (category) filters.category = category;
  
  const level = searchParams.get("level");
  if (level) filters.level = level as any;
  
  const courses = await mockDataProvider.getCourses(filters);
  return NextResponse.json({ courses });
}
