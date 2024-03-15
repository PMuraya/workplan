with
    --Load activities
    activities as (
        select
        
            --activity
            activity.activity as activity_activity,
            activity.summary as activity_summary,

                --project
                project.summary as project_summary,
                project.project as project_project,
                    --workplan
                    workplan.year as workplan_year,
                    
                        --intern
                        intern.surname as intern_surname
        from 
            activity
            inner join project on activity.project = project.project
            inner join workplan on project.workplan = workplan.workplan
            inner join intern on workplan.intern = intern.intern
    ),
--Minutes
minutes as (
    select
        --
        --all minute attributes
        minute.num as minute_num,
        minute.detail as minute_detail,
        minute.summary as minute summary,
        minute.minute as minute_minute,
            --minute
            activities.*,
            presentation.date as presentation_date

    from 
        activities
        inner join project on activities.project_project = project.project
        inner join workplan on project.workplan = workplan.workplan
        inner join intern on workplan.intern = intern.intern
        inner join presentation on presentation.intern = intern.intern 
        inner join minute on minute.presentation=presentation.presentation 
            and minute.activity = activities.activity_activity
),
--
--contribution
contributions as (
    select
        --all contribution attributes
        contribution.num as contribution_num,
        contribution.detail as contribution_detail,
        contribution.summary as contribution_summary,
        --
         minutes.*   
    from 
        contribution
        inner join minutes on  contribution.minute = minutes.minute_minute    
     )


